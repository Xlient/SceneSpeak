import type { InferenceSource } from "firebase/ai";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { EMPTY_PRACTICE } from "../progress/streak";
import { weeklySummary } from "../progress/weekly";
import { COACH_JSON_SCHEMA, buildCoachPrompt } from "./coach-prompt";
import { EXPLAIN_JSON_SCHEMA, buildExplainPrompt } from "./explain-prompt";
import { createModelCoach } from "./model-coach";
import { createModelExplainer } from "./model-explainer";
import { ModelOutputError, parseModelJson, withOneRetry } from "./model-json";

const model = (...texts: string[]) => ({
  generateText: vi.fn(async () => ({ text: texts.shift() ?? "{}", source: "on_device" as InferenceSource | undefined })),
});
const signal = () => new AbortController().signal;

describe("parseModelJson", () => {
  const Shape = z.object({ n: z.number() });

  it("parses plain and fenced JSON", () => {
    expect(parseModelJson('{"n":1}', Shape)).toEqual({ n: 1 });
    expect(parseModelJson('```json\n{"n":2}\n```', Shape)).toEqual({ n: 2 });
  });

  it("throws ModelOutputError with the raw text for bad JSON or the wrong shape", () => {
    expect(() => parseModelJson("nope", Shape)).toThrow(ModelOutputError);
    try {
      parseModelJson('{"n":"x"}', Shape);
    } catch (error) {
      expect(error).toBeInstanceOf(ModelOutputError);
      expect((error as ModelOutputError).raw).toBe('{"n":"x"}');
    }
  });
});

describe("withOneRetry", () => {
  it("retries once on a parse error only", async () => {
    const flaky = vi.fn().mockRejectedValueOnce(new ModelOutputError("bad", "x")).mockResolvedValueOnce("ok");
    await expect(withOneRetry(flaky)).resolves.toBe("ok");
    const broken = vi.fn().mockRejectedValue(new Error("network"));
    await expect(withOneRetry(broken)).rejects.toThrow("network");
    expect(broken).toHaveBeenCalledTimes(1);
  });
});

describe("explainer", () => {
  const breakdown = JSON.stringify({
    structure: "Spanish drops the subject.",
    words: [{ text: "Me", role: "pronoun", meaning: "myself", note: null }, { text: "llamo", role: "verb", meaning: "I call", note: "llamarse, 1st person" }],
  });
  const request = () => ({ text: "Me llamo <b>Sam</b>.", language: "es", translation: "My name is Sam.", signal: signal() });

  it("builds a prompt with the language name and escapes the sentence", () => {
    const prompt = buildExplainPrompt(request());
    expect(prompt).toContain("Language: Spanish");
    expect(prompt).toContain("<sentence>Me llamo &lt;b&gt;Sam&lt;/b&gt;.</sentence>");
    expect(prompt).toContain("My name is Sam.");
  });

  it("asks for every word field", () => {
    expect(EXPLAIN_JSON_SCHEMA.properties.words.items.required).toEqual(["text", "role", "meaning", "note"]);
  });

  it("returns the validated breakdown and where it ran", async () => {
    const m = model(breakdown);
    const req = request();
    await expect(createModelExplainer(m)(req)).resolves.toMatchObject({ source: "on_device", breakdown: { words: [{ text: "Me" }, { text: "llamo" }] } });
    expect(m.generateText).toHaveBeenCalledWith(expect.any(String), { signal: req.signal });
  });

  it("retries once when the output doesn't parse", async () => {
    const m = model("garbage", breakdown);
    await expect(createModelExplainer(m)(request())).resolves.toMatchObject({ breakdown: { structure: "Spanish drops the subject." } });
    expect(m.generateText).toHaveBeenCalledTimes(2);
  });
});

describe("coach", () => {
  const lessons = [{ id: "coffee-at-the-cafe", title: "Coffee at the café", level: "A1" }, { id: "bakery", title: "Bakery", level: "A1" }];
  const summary = { ...weeklySummary(EMPTY_PRACTICE, "2026-11-14"), daysPractised: 3, lessons: 4, goalsDone: 9, goalsTotal: 12, recentLessonIds: ["bakery"] };
  const request = () => ({ summary, language: "es", lessons, signal: signal() });

  it("puts only counts and lesson titles in the prompt", () => {
    const prompt = buildCoachPrompt(request());
    expect(prompt).toContain("days practised: 3 of 7");
    expect(prompt).toContain("goals reached: 9 of 12");
    expect(prompt).toContain('- bakery: "Bakery" (A1) [done this week]');
    expect(prompt).toContain('- coffee-at-the-cafe: "Coffee at the café" (A1)\n'.trimEnd());
  });

  it("requires all three fields", () => {
    expect(COACH_JSON_SCHEMA.required).toEqual(["recap", "tip", "nextLessonId"]);
  });

  it("returns the validated note", async () => {
    const m = model(JSON.stringify({ recap: "You practised 3 days.", tip: "Try one more day.", nextLessonId: "coffee-at-the-cafe" }));
    await expect(createModelCoach(m)(request())).resolves.toEqual({
      note: { recap: "You practised 3 days.", tip: "Try one more day.", nextLessonId: "coffee-at-the-cafe" },
      source: "on_device",
    });
  });
});
