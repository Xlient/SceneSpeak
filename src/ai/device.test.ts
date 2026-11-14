import { afterEach, describe, expect, it, vi } from "vitest";
import { type DeviceModelStatus, type DeviceSetupPort, hasPromptApi, initDeviceModel } from "./device";

const collect = () => {
  const statuses: DeviceModelStatus[] = [];
  return { statuses, onStatus: (status: DeviceModelStatus) => statuses.push(status) };
};

const setupModel = (initializeDeviceModel: DeviceSetupPort["initializeDeviceModel"]): DeviceSetupPort => ({
  initializeDeviceModel: vi.fn(initializeDeviceModel),
});

const supported = () => true;

describe("hasPromptApi", () => {
  it("is true only when Chrome's LanguageModel global exists", () => {
    expect(hasPromptApi({ LanguageModel: {} })).toBe(true);
    expect(hasPromptApi({})).toBe(false);
  });
});

describe("initDeviceModel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports not-supported and never creates a model when the browser lacks the Prompt API", async () => {
    const createSetupModel = vi.fn(() => setupModel(async () => {}));
    const { statuses, onStatus } = collect();

    const result = await initDeviceModel(onStatus, {}, { isSupported: () => false, createSetupModel });

    expect(result).toEqual({ kind: "not-supported" });
    expect(statuses).toEqual([{ kind: "not-supported" }]);
    expect(createSetupModel).not.toHaveBeenCalled();
  });

  it("goes checking → ready when the model is already downloaded", async () => {
    const { statuses, onStatus } = collect();
    const result = await initDeviceModel(onStatus, {}, { isSupported: supported, createSetupModel: () => setupModel(async () => {}) });

    expect(result).toEqual({ kind: "ready" });
    expect(statuses).toEqual([{ kind: "checking" }, { kind: "ready" }]);
  });

  it("reports download progress in order, clamped to 0–1", async () => {
    const model = setupModel(async (onProgress) => {
      onProgress?.(0.25);
      onProgress?.(0.8);
      onProgress?.(1.3);
    });
    const { statuses, onStatus } = collect();

    await initDeviceModel(onStatus, {}, { isSupported: supported, createSetupModel: () => model });

    expect(statuses).toEqual([
      { kind: "checking" },
      { kind: "downloading", progress: 0.25 },
      { kind: "downloading", progress: 0.8 },
      { kind: "downloading", progress: 1 },
      { kind: "ready" },
    ]);
  });

  it("starts the SDK call right away, with no await first (Chrome needs the click's user activation)", () => {
    const model = setupModel(() => new Promise(() => {}));
    void initDeviceModel(() => {}, {}, { isSupported: supported, createSetupModel: () => model });

    expect(model.initializeDeviceModel).toHaveBeenCalledTimes(1);
  });

  it("reports unavailable with the SDK's reason when setup fails", async () => {
    const model = setupModel(async () => {
      throw new Error("Local LanguageModel API not available in this environment.");
    });
    const { onStatus } = collect();

    const result = await initDeviceModel(onStatus, {}, { isSupported: supported, createSetupModel: () => model });

    expect(result).toEqual({ kind: "unavailable", reason: "Local LanguageModel API not available in this environment." });
  });

  it("reports unavailable when the model can't even be created (e.g. missing Firebase config)", async () => {
    const { onStatus } = collect();
    const result = await initDeviceModel(onStatus, {}, {
      isSupported: supported,
      createSetupModel: () => {
        throw new Error("Firebase config is missing or invalid");
      },
    });

    expect(result).toEqual({ kind: "unavailable", reason: "Firebase config is missing or invalid" });
  });

  it("reports unavailable when the download takes longer than the timeout", async () => {
    vi.useFakeTimers();
    const model = setupModel(() => new Promise(() => {}));
    const promise = initDeviceModel(() => {}, { timeoutMs: 100 }, { isSupported: supported, createSetupModel: () => model });

    vi.advanceTimersByTime(100);
    await expect(promise).resolves.toEqual({ kind: "unavailable", reason: "AI call timed out after 100 ms" });
  });

  it("goes back to idle when the caller cancels, so the learner can try again", async () => {
    const controller = new AbortController();
    const model = setupModel(() => new Promise(() => {}));
    const { statuses, onStatus } = collect();
    const promise = initDeviceModel(onStatus, { signal: controller.signal }, { isSupported: supported, createSetupModel: () => model });

    controller.abort();

    await expect(promise).resolves.toEqual({ kind: "idle" });
    expect(statuses.at(-1)).toEqual({ kind: "idle" });
  });

  it("ignores progress that arrives after setup has finished (Chrome keeps downloading after a cancel)", async () => {
    const controller = new AbortController();
    let lateProgress: ((progress: number) => void) | undefined;
    const model = setupModel((onProgress) => {
      lateProgress = onProgress;
      return new Promise(() => {});
    });
    const { statuses, onStatus } = collect();
    const promise = initDeviceModel(onStatus, { signal: controller.signal }, { isSupported: supported, createSetupModel: () => model });

    controller.abort();
    await promise;
    lateProgress?.(0.5);

    expect(statuses.at(-1)).toEqual({ kind: "idle" });
  });
});
