import { describe, expect, it } from "vitest";
import { LESSON_PROMPT_MAX, checkLessonPrompt, unavailableGenerator } from "./generator";

describe("checkLessonPrompt", () => {
  it("tidies whitespace", () => {
    expect(checkLessonPrompt("  opening   a bank\naccount ")).toEqual({ ok: true, prompt: "opening a bank account" });
  });

  it("rejects too short and too long prompts", () => {
    expect(checkLessonPrompt("hi").ok).toBe(false);
    expect(checkLessonPrompt("a".repeat(LESSON_PROMPT_MAX + 1)).ok).toBe(false);
  });
});

describe("unavailableGenerator", () => {
  it("rejects with a clear message", async () => {
    const request = { prompt: "x", language: "es" as const, signal: new AbortController().signal, onProgress: () => undefined };
    await expect(unavailableGenerator(request)).rejects.toThrow("isn't connected");
  });
});
