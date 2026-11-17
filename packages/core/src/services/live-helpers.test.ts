import type { InferenceMode, InferenceSource } from "firebase/ai";
import { describe, expect, it, vi } from "vitest";
import type { DeviceModelStatus } from "../ai/device";
import { EMPTY_PRACTICE } from "../progress/streak";
import { weeklySummary } from "../progress/weekly";
import { CoachNeedsDeviceError, createLiveCoach, createLiveExplainer } from "./live-helpers";
import { NotConnectedError } from "./not-connected";

const fake = (text: string) => () => ({ generateText: vi.fn(async () => ({ text, source: "on_device" as InferenceSource | undefined })) });
const breakdown = JSON.stringify({ structure: "s", words: [{ text: "Hola", role: "interjection", meaning: "hi", note: null }] });
const note = JSON.stringify({ recap: "r", tip: "t", nextLessonId: null });
const signal = () => new AbortController().signal;

describe("createLiveExplainer", () => {
  const request = (language = "es") => ({ text: "Hola", language, translation: "Hi", signal: signal() });
  const setup = (status: DeviceModelStatus, online = true) => {
    const makeModel = vi.fn((_mode: InferenceMode) => fake(breakdown)());
    return { makeModel, explainer: createLiveExplainer({ deviceStatus: () => status, isOnline: () => online, makeModel }) };
  };

  it("goes device first when Nano is ready, and reuses the model", async () => {
    const { explainer, makeModel } = setup({ kind: "ready" });
    await explainer(request());
    await expect(explainer(request())).resolves.toMatchObject({ source: "on_device", route: expect.stringMatching(/^Device first/) });
    expect(makeModel.mock.calls).toEqual([["prefer_on_device"]]);
  });

  it("uses the cloud for languages Nano doesn't support or while it downloads", async () => {
    const french = setup({ kind: "ready" });
    await french.explainer(request("fr"));
    expect(french.makeModel).toHaveBeenCalledWith("only_in_cloud");

    const busy = setup({ kind: "downloading", progress: 0.2 });
    await busy.explainer(request());
    expect(busy.makeModel).toHaveBeenCalledWith("only_in_cloud");
  });

  it("rejects instead of throwing when setup fails", async () => {
    const explainer = createLiveExplainer({
      deviceStatus: () => ({ kind: "ready" }),
      isOnline: () => true,
      makeModel: () => {
        throw new Error("Firebase config is missing");
      },
    });
    await expect(explainer(request())).rejects.toThrow("Firebase config is missing");
  });
});

describe("createLiveCoach", () => {
  const request = () => ({ summary: weeklySummary(EMPTY_PRACTICE, "2026-11-14"), language: "es", lessons: [], signal: signal() });

  it("only ever builds an on-device model", async () => {
    const makeModel = vi.fn((_mode: InferenceMode) => fake(note)());
    const coach = createLiveCoach({ deviceStatus: () => ({ kind: "idle" }), makeModel });
    await expect(coach(request())).resolves.toMatchObject({ note: { recap: "r" }, route: "Device only: practice stats stay private" });
    expect(makeModel.mock.calls).toEqual([["only_on_device"]]);
  });

  it.each([{ kind: "not-supported" }, { kind: "unavailable", reason: "no space" }] as const)("refuses without a model when the device is $kind", async (status) => {
    const makeModel = vi.fn((_mode: InferenceMode) => fake(note)());
    const coach = createLiveCoach({ deviceStatus: () => status, makeModel });
    const error = await coach(request()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CoachNeedsDeviceError);
    expect(error).toBeInstanceOf(NotConnectedError);
    expect(makeModel).not.toHaveBeenCalled();
  });

  it("asks for setup when Nano isn't downloaded yet", async () => {
    const coach = createLiveCoach({
      deviceStatus: () => ({ kind: "idle" }),
      makeModel: () => ({ generateText: async () => Promise.reject(new Error("on-device model unavailable")) }),
    });
    await expect(coach(request())).rejects.toBeInstanceOf(CoachNeedsDeviceError);
  });

  it("passes other errors through once Nano is ready", async () => {
    const coach = createLiveCoach({
      deviceStatus: () => ({ kind: "ready" }),
      makeModel: () => ({ generateText: async () => Promise.reject(new Error("boom")) }),
    });
    await expect(coach(request())).rejects.toThrow("boom");
  });
});
