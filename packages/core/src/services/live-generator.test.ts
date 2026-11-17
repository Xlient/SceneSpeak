import type { InferenceMode, InferenceSource } from "firebase/ai";
import { describe, expect, it, vi } from "vitest";
import type { DeviceModelStatus } from "../ai/device";
import { goodLessonJson, safeScreenJson } from "../ai/lesson-fixtures";
import { unavailableLibrary } from "../library/library";
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
    const result = await generator(request());

    if (result.kind !== "generated") throw new Error("expected a generated lesson");
    expect(result.lesson.scenario.lines.length).toBeGreaterThan(0);
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

  it("suggests a published lesson found on-device instead of writing one", async () => {
    const row = { id: "lib-1", title: "Meeting the neighbours", topic: "meeting a new neighbour", language: "es", level: "A1", intents: ["greet"], authorUid: "u", authorName: "Sam", votes: 5, hidden: false };
    const library = { ...unavailableLibrary, list: async () => [row] };
    const writeCalls = vi.fn();
    const makeModel = vi.fn((role: ModelRole, _mode: InferenceMode) => ({
      generateText: vi.fn(async () => {
        if (role === "write") writeCalls();
        return {
          text: role === "screen" ? safeScreenJson : role === "match" ? '{"matchId":"lib-1"}' : goodLessonJson,
          source: "on_device" as InferenceSource | undefined,
        };
      }),
    }));
    const generator = createLiveGenerator({ deviceStatus: () => ({ kind: "ready" }), isOnline: () => true, makeModel, library });

    expect(await generator(request())).toEqual({ kind: "existing", match: { id: "lib-1", title: "Meeting the neighbours", votes: 5 } });
    expect(makeModel).toHaveBeenCalledWith("match", "prefer_on_device");
    expect(writeCalls).not.toHaveBeenCalled();
  });
});
