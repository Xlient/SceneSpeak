import { describe, expect, it } from "vitest";
import { FEATURED_LESSONS } from "@scenespeak/core/lesson/featured/featured-lessons";
import { LEARNER_SPEAKER } from "@scenespeak/core/schemas";
import type { GenerateRequest, HybridModel } from "../ai-port/hybrid-model";
import { createUnavailableModel } from "../ai-port/unavailable-model";
import { VoiceOfflineError, createMobileVoiceGrader } from "./mobile-voice-grader";

const scenario = FEATURED_LESSONS[0]?.scenario;
const line = scenario?.lines.find((l) => l.speaker === LEARNER_SPEAKER);
if (!scenario || !line) throw new Error("No learner line");
const audio = { mimeType: "audio/aac", data: "AAAA" };
const request = () => ({ scenario, line, audio, signal: new AbortController().signal });

const answer = JSON.stringify({
  transcript: line.text,
  ok: true,
  meaningMatches: true,
  score: 90,
  correction: null,
  hint: null,
  goalId: line.expects,
  errorType: "none",
});

const fakePort = (seen: GenerateRequest[], replies: string[]): HybridModel => ({
  ...createUnavailableModel("unused"),
  generate: (req) => {
    seen.push(req);
    return Promise.resolve({ text: replies.shift() ?? answer, inferenceSource: "in_cloud", latencyMs: 900 });
  },
});

describe("createMobileVoiceGrader", () => {
  it("sends the audio to the cloud and returns the transcript and grade", async () => {
    const seen: GenerateRequest[] = [];
    const grade = createMobileVoiceGrader({ port: fakePort(seen, []), isOnline: () => true });
    const result = await grade(request());
    expect(seen[0]?.mode).toBe("only_in_cloud");
    expect(seen[0]?.audio).toEqual(audio);
    expect(seen[0]?.schemaId).toBe("voice-grade");
    expect(result.transcript).toBe(line.text);
    expect(result.source).toBe("in_cloud");
  });

  it("retries once on bad JSON", async () => {
    const seen: GenerateRequest[] = [];
    const grade = createMobileVoiceGrader({ port: fakePort(seen, ["not json"]), isOnline: () => true });
    await grade(request());
    expect(seen).toHaveLength(2);
  });

  it("refuses offline without calling the model", async () => {
    const seen: GenerateRequest[] = [];
    const grade = createMobileVoiceGrader({ port: fakePort(seen, []), isOnline: () => false });
    await expect(grade(request())).rejects.toBeInstanceOf(VoiceOfflineError);
    expect(seen).toHaveLength(0);
  });
});
