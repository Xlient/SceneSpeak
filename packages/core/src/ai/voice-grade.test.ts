import type { InferenceSource } from "firebase/ai";
import { describe, expect, it, vi } from "vitest";
import { askName, scenario } from "./grade-fixtures";
import { GradeParseError } from "./grade-parse";
import { createModelVoiceGrader } from "./model-voice-grader";
import { parseVoiceGrade } from "./voice-grade-parse";
import { VOICE_GRADE_JSON_SCHEMA, VOICE_GRADE_SYSTEM_INSTRUCTION, buildVoiceGradePrompt } from "./voice-grade-prompt";

const gradeJson = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({ transcript: "Me llamo Sam", ok: true, meaningMatches: true, score: 88, correction: null, hint: null, goalId: "say-name", errorType: "none", ...overrides });

describe("voice grade prompt", () => {
  it("points at the audio instead of quoting a typed reply", () => {
    const prompt = buildVoiceGradePrompt({ scenario, line: askName });
    expect(prompt).toContain("Learner's reply: the attached audio.");
    expect(prompt).not.toContain("<reply>");
    expect(prompt).toContain(askName.text);
  });

  it("requires a transcript and keeps the grade fields", () => {
    expect(VOICE_GRADE_JSON_SCHEMA.required).toEqual(expect.arrayContaining(["transcript", "ok", "score"]));
    expect(VOICE_GRADE_SYSTEM_INSTRUCTION).toMatch(/transcript/);
    expect(VOICE_GRADE_SYSTEM_INSTRUCTION.match(/Respond with JSON only\./g)).toHaveLength(1);
  });
});

describe("parseVoiceGrade", () => {
  it("returns the grade and the transcript", () => {
    expect(parseVoiceGrade(gradeJson(), askName)).toMatchObject({ transcript: "Me llamo Sam", grade: { ok: true, score: 88, goalId: "say-name" } });
  });

  it("never passes a reply with no speech", () => {
    const { grade, transcript } = parseVoiceGrade(gradeJson({ transcript: "  " }), askName);
    expect(transcript).toBe("");
    expect(grade).toMatchObject({ ok: false, score: 0, goalId: null });
    expect(grade.hint).toMatch(/microphone/);
  });

  it("throws GradeParseError for bad JSON", () => {
    expect(() => parseVoiceGrade("not json", askName)).toThrow(GradeParseError);
  });
});

describe("createModelVoiceGrader", () => {
  const audio = new Blob(["fake"], { type: "audio/webm;codecs=opus" });
  const encode = vi.fn(async () => ({ mimeType: "audio/wav", data: "QUJD" }));
  const request = () => ({ scenario, line: askName, audio, signal: new AbortController().signal });
  const model = (...texts: string[]) => {
    const generate = vi.fn(async () => ({ text: texts.shift() ?? gradeJson(), source: "in_cloud" as InferenceSource | undefined }));
    return { generate };
  };

  it("sends the prompt and the encoded audio in one call, with the caller's signal", async () => {
    const m = model();
    const req = request();
    await createModelVoiceGrader(m, encode)(req);
    expect(encode).toHaveBeenCalledWith(audio);
    expect(m.generate).toHaveBeenCalledWith(
      [expect.stringContaining("the attached audio"), { type: "inlineData", inlineData: { mimeType: "audio/wav", data: "QUJD" } }],
      expect.objectContaining({ signal: req.signal }),
    );
  });

  it("returns the grade, transcript and source", async () => {
    await expect(createModelVoiceGrader(model(), encode)(request())).resolves.toMatchObject({
      grade: { score: 88 },
      transcript: "Me llamo Sam",
      source: "in_cloud",
    });
  });

  it("retries once on bad JSON, then gives up", async () => {
    const ok = model("oops");
    await expect(createModelVoiceGrader(ok, encode)(request())).resolves.toMatchObject({ transcript: "Me llamo Sam" });
    expect(ok.generate).toHaveBeenCalledTimes(2);

    const bad = model("oops", "still oops");
    await expect(createModelVoiceGrader(bad, encode)(request())).rejects.toBeInstanceOf(GradeParseError);
  });

  it("doesn't retry other errors", async () => {
    const generate = vi.fn(async () => {
      throw new Error("network");
    });
    await expect(createModelVoiceGrader({ generate }, encode)(request())).rejects.toThrow("network");
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
