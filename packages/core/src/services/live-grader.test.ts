import type { InferenceMode, InferenceSource } from "firebase/ai";
import { describe, expect, it, vi } from "vitest";
import type { DeviceModelStatus } from "../ai/device";
import { askName, goodGradeJson, scenario } from "../ai/grade-fixtures";
import { createLiveGrader } from "./live-grader";

const request = (reply = "Me llamo Sam") => ({ scenario, line: askName, reply, signal: new AbortController().signal });
const fakeModel = () => ({
  generateText: vi.fn(async () => ({ text: goodGradeJson, source: "on_device" as InferenceSource | undefined })),
});

const setup = (status: DeviceModelStatus = { kind: "ready" }, online = true) => {
  const makeModel = vi.fn((_mode: InferenceMode) => fakeModel());
  const grader = createLiveGrader({ deviceStatus: () => status, isOnline: () => online, makeModel });
  return { grader, makeModel };
};

describe("createLiveGrader", () => {
  it("doesn't build a model until the first grade", () => {
    const { makeModel } = setup();
    expect(makeModel).not.toHaveBeenCalled();
  });

  it("builds the model for the routed mode once and reuses it", async () => {
    const { grader, makeModel } = setup();
    await grader(request());
    await grader(request());

    expect(makeModel).toHaveBeenCalledTimes(1);
    expect(makeModel).toHaveBeenCalledWith("prefer_on_device", "es");
  });

  it("routes to the cloud while Nano is downloading", async () => {
    const { grader, makeModel } = setup({ kind: "downloading", progress: 0.3 });
    await grader(request());
    expect(makeModel).toHaveBeenCalledWith("only_in_cloud", "es");
  });

  it("routes on-device only when offline with Nano ready", async () => {
    const { grader, makeModel } = setup({ kind: "ready" }, false);
    await grader(request());
    expect(makeModel).toHaveBeenCalledWith("only_on_device", "es");
  });

  it("reads the device state on every call, not just the first", async () => {
    let status: DeviceModelStatus = { kind: "downloading", progress: 0.5 };
    const makeModel = vi.fn((_mode: InferenceMode) => fakeModel());
    const grader = createLiveGrader({ deviceStatus: () => status, isOnline: () => true, makeModel });

    await grader(request());
    status = { kind: "ready" };
    await grader(request());

    expect(makeModel.mock.calls.map(([mode]) => mode)).toEqual(["only_in_cloud", "prefer_on_device"]);
  });

  it("returns the grade with the routing reason", async () => {
    const { grader } = setup();
    await expect(grader(request())).resolves.toMatchObject({
      grade: { score: 90 },
      source: "on_device",
      route: expect.stringMatching(/^Device/),
    });
  });

  it("turns a setup error into a rejected promise instead of throwing", async () => {
    const grader = createLiveGrader({
      deviceStatus: () => ({ kind: "ready" }),
      makeModel: () => {
        throw new Error("Firebase config is missing");
      },
    });
    await expect(grader(request())).rejects.toThrow("Firebase config is missing");
  });
});

describe("createLiveGrader across languages", () => {
  const forLanguage = (language: string) => ({ ...request(), scenario: { ...scenario, language } });

  it("builds one on-device model per supported language and routes cloud-only ones to the cloud", async () => {
    const makeModel = vi.fn((_mode: InferenceMode, _language: string) => fakeModel());
    const grader = createLiveGrader({ deviceStatus: () => ({ kind: "ready" }), isOnline: () => true, makeModel });

    await grader(forLanguage("es"));
    await grader(forLanguage("ja"));
    await grader(forLanguage("ja"));
    const korean = await grader(forLanguage("ko"));

    expect(makeModel.mock.calls).toEqual([
      ["prefer_on_device", "es"],
      ["prefer_on_device", "ja"],
      ["only_in_cloud", "ko"],
    ]);
    expect(korean.route).toBe("Cloud: on-device AI doesn't support Korean yet");
  });

  it("shares one cloud model between cloud-only languages", async () => {
    const makeModel = vi.fn((_mode: InferenceMode, _language: string) => fakeModel());
    const grader = createLiveGrader({ deviceStatus: () => ({ kind: "ready" }), isOnline: () => true, makeModel });
    await grader(forLanguage("it"));
    await grader(forLanguage("zh"));
    expect(makeModel).toHaveBeenCalledTimes(1);
  });
});
