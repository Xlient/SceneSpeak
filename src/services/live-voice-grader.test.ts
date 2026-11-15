import type { InferenceMode, InferenceSource } from "firebase/ai";
import { describe, expect, it, vi } from "vitest";
import { askName, scenario } from "../ai/grade-fixtures";
import { VoiceOfflineError, createLiveVoiceGrader } from "./live-voice-grader";

const json = JSON.stringify({ transcript: "Me llamo Sam", ok: true, meaningMatches: true, score: 90, correction: null, hint: null, goalId: null, errorType: "none" });
const request = () => ({ scenario, line: askName, audio: new Blob(["x"]), signal: new AbortController().signal });
const encode = async () => ({ mimeType: "audio/wav", data: "QQ==" });
const fakeModel = () => ({ generate: vi.fn(async () => ({ text: json, source: "in_cloud" as InferenceSource | undefined })) });

describe("createLiveVoiceGrader", () => {
  it("always uses a cloud-only model, built once on first use", async () => {
    const makeModel = vi.fn((_mode: InferenceMode) => fakeModel());
    const grader = createLiveVoiceGrader({ isOnline: () => true, makeModel, encode });
    expect(makeModel).not.toHaveBeenCalled();
    await grader(request());
    await grader(request());
    expect(makeModel).toHaveBeenCalledTimes(1);
    expect(makeModel).toHaveBeenCalledWith("only_in_cloud");
  });

  it("returns the routing reason with the grade", async () => {
    const grader = createLiveVoiceGrader({ isOnline: () => true, makeModel: fakeModel, encode });
    await expect(grader(request())).resolves.toMatchObject({ transcript: "Me llamo Sam", source: "in_cloud", route: expect.stringMatching(/^Cloud: audio/) });
  });

  it("fails fast offline without touching the model or the audio", async () => {
    const makeModel = vi.fn(fakeModel);
    const encodeSpy = vi.fn(encode);
    const grader = createLiveVoiceGrader({ isOnline: () => false, makeModel, encode: encodeSpy });
    await expect(grader(request())).rejects.toBeInstanceOf(VoiceOfflineError);
    expect(makeModel).not.toHaveBeenCalled();
    expect(encodeSpy).not.toHaveBeenCalled();
  });

  it("turns a setup error into a rejected promise", async () => {
    const grader = createLiveVoiceGrader({
      isOnline: () => true,
      encode,
      makeModel: () => {
        throw new Error("Firebase config is missing");
      },
    });
    await expect(grader(request())).rejects.toThrow("Firebase config is missing");
  });
});
