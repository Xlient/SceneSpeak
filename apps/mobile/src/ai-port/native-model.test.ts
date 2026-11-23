import { AiAbortedError, AiTimeoutError } from "@scenespeak/core/ai/with-timeout";
import { describe, expect, it, vi } from "vitest";
import { HybridModelUnavailableError } from "./hybrid-model";
import { type NativeHybridAi, asNativeHybridAi, createNativeModel } from "./native-model";

const options = (timeoutMs = 1000) => ({ signal: new AbortController().signal, timeoutMs });

const fakeNative = (overrides: Partial<NativeHybridAi> = {}): NativeHybridAi => ({
  status: () => Promise.resolve({ status: "available", modelName: "gemini-nano" }),
  download: () => Promise.resolve({ status: "downloading" }),
  warmUp: () => Promise.resolve(null),
  generate: () => Promise.resolve({ text: "{}", inferenceSource: "on_device", latencyMs: 12 }),
  ...overrides,
});

describe("createNativeModel", () => {
  it("parses the native status", async () => {
    await expect(createNativeModel(fakeNative()).status(options())).resolves.toEqual({ status: "available", modelName: "gemini-nano" });
  });

  it("treats an unexpected status answer as unavailable", async () => {
    const model = createNativeModel(fakeNative({ status: () => Promise.resolve("yes") }));
    await expect(model.status(options())).resolves.toMatchObject({ status: "unavailable" });
  });

  it("sends only the fields that are set, with the native timeout", async () => {
    const generate = vi.fn(fakeNative().generate);
    const model = createNativeModel(fakeNative({ generate }));
    await model.generate({ prompt: "hola", mode: "prefer_on_device", schemaId: "grade" }, options(800));
    expect(generate).toHaveBeenCalledWith({ prompt: "hola", mode: "prefer_on_device", schemaId: "grade" }, 800);
  });

  it("rejects a malformed generate result", async () => {
    const model = createNativeModel(fakeNative({ generate: () => Promise.resolve({ text: "x", inferenceSource: "edge", latencyMs: 1 }) }));
    await expect(model.generate({ prompt: "hola", mode: "only_on_device" }, options())).rejects.toThrow();
  });

  it("maps a missing Firebase config to the not-connected error", async () => {
    const error = Object.assign(new Error("add google-services.json"), { code: "ERR_NOT_CONFIGURED" });
    const model = createNativeModel(fakeNative({ generate: () => Promise.reject(error) }));
    await expect(model.generate({ prompt: "hola", mode: "prefer_on_device" }, options())).rejects.toBeInstanceOf(HybridModelUnavailableError);
  });

  it("times out when the native call hangs", async () => {
    const model = createNativeModel(fakeNative({ generate: () => new Promise(() => {}) }));
    await expect(model.generate({ prompt: "hola", mode: "only_on_device" }, options(20))).rejects.toBeInstanceOf(AiTimeoutError);
  });

  it("stops when the caller aborts", async () => {
    const controller = new AbortController();
    const model = createNativeModel(fakeNative({ generate: () => new Promise(() => {}) }));
    const pending = model.generate({ prompt: "hola", mode: "only_on_device" }, { signal: controller.signal, timeoutMs: 1000 });
    controller.abort();
    await expect(pending).rejects.toBeInstanceOf(AiAbortedError);
  });

  it("clamps progress and drops a bad value", async () => {
    const model = (raw: unknown) => createNativeModel(fakeNative({ status: () => Promise.resolve(raw) }));
    await expect(model({ status: "downloading", progress: 1.7 }).status(options())).resolves.toEqual({ status: "downloading", progress: 1 });
    await expect(model({ status: "downloading", progress: "half" }).status(options())).resolves.toEqual({ status: "downloading" });
  });

  it("reports each status while the download runs", async () => {
    const status = vi.fn().mockResolvedValueOnce({ status: "downloading", progress: 0.5 }).mockResolvedValue({ status: "available" });
    const onUpdate = vi.fn();
    const model = createNativeModel(fakeNative({ download: () => Promise.resolve({ status: "downloading", progress: 0.1 }), status }), 1);
    await model.download({ ...options(), onUpdate });
    expect(onUpdate.mock.calls.map(([info]) => info.progress)).toEqual([0.1, 0.5]);
  });

  it("polls the download until it settles", async () => {
    const status = vi.fn().mockResolvedValueOnce({ status: "downloading" }).mockResolvedValue({ status: "available" });
    const model = createNativeModel(fakeNative({ status }), 1);
    await expect(model.download(options())).resolves.toEqual({ status: "available" });
    expect(status).toHaveBeenCalledTimes(2);
  });
});

describe("asNativeHybridAi", () => {
  it("accepts a module with all four functions", () => {
    expect(asNativeHybridAi(fakeNative())).not.toBeNull();
  });

  it("rejects a module that only has a name (the iOS stub)", () => {
    expect(asNativeHybridAi({})).toBeNull();
    expect(asNativeHybridAi(null)).toBeNull();
  });
});
