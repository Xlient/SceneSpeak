import type { InferenceMode, InferenceSource } from "firebase/ai";
import { describe, expect, it, vi } from "vitest";
import type { DeviceModelStatus } from "../ai/device";
import { goodLessonJson, safeScreenJson } from "../ai/lesson-fixtures";
import { type ModelRole, createLiveGenerator } from "./live-generator";

const request = () => ({
  prompt: "meeting my new neighbour",
  language: "es" as const,
  signal: new AbortController().signal,
  onProgress: () => {},
});

const setup = (status: DeviceModelStatus = { kind: "ready" }, online = true) => {
  const makeModel = vi.fn((role: ModelRole, _mode: InferenceMode) => ({
    generateText: vi.fn(async () => ({
      text: role === "screen" ? safeScreenJson : goodLessonJson,
      source: "in_cloud" as InferenceSource | undefined,
    })),
  }));
  const generator = createLiveGenerator({ deviceStatus: () => status, isOnline: () => online, makeModel });
  return { generator, makeModel };
};

describe("createLiveGenerator", () => {
  it("doesn't build models until the first request", () => {
    const { makeModel } = setup();
    expect(makeModel).not.toHaveBeenCalled();
  });

  it("screens on-device first and always writes in the cloud", async () => {
    const { generator, makeModel } = setup();
    const lesson = await generator(request());

    expect(lesson.scenario.lines.length).toBeGreaterThan(0);
    expect(makeModel).toHaveBeenCalledWith("screen", "prefer_on_device");
    expect(makeModel).toHaveBeenCalledWith("write", "only_in_cloud");
  });

  it("screens in the cloud while Nano is downloading", async () => {
    const { generator, makeModel } = setup({ kind: "downloading", progress: 0.5 });
    await generator(request());
    expect(makeModel).toHaveBeenCalledWith("screen", "only_in_cloud");
  });

  it("reuses models across requests", async () => {
    const { generator, makeModel } = setup();
    await generator(request());
    await generator(request());
    expect(makeModel).toHaveBeenCalledTimes(2);
  });

  it("rejects instead of throwing when a model can't be built", async () => {
    const generator = createLiveGenerator({
      deviceStatus: () => ({ kind: "ready" }),
      isOnline: () => true,
      makeModel: () => {
        throw new Error("no config");
      },
    });
    await expect(generator(request())).rejects.toThrow("no config");
  });
});
