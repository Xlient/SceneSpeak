import { type GenerateContentResult, type HybridParams, InferenceMode, type InferenceSource } from "firebase/ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_CLOUD_MODEL,
  DEFAULT_TIMEOUT_MS,
  type ModelPort,
  type ModelRequest,
  buildHybridParams,
  createModel,
} from "./model";
import { AiAbortedError, AiTimeoutError } from "./with-timeout";

const fakeResult = (text: string, inferenceSource?: InferenceSource): GenerateContentResult => ({
  response: {
    text: () => text,
    inlineDataParts: () => undefined,
    functionCalls: () => undefined,
    thoughtSummary: () => undefined,
    ...(inferenceSource ? { inferenceSource } : {}),
  },
});

// Stands in for Firebase's GenerativeModel so tests never make a real call.
const fakePort = (generateContent: ModelPort["generateContent"] = async () => fakeResult("hola", "on_device")) => ({
  generateContent: vi.fn(generateContent),
  initializeDeviceModel: vi.fn(async () => {}),
});

const hangUntilAborted: ModelPort["generateContent"] = (_request, options) =>
  new Promise((_, reject) => {
    options?.signal?.addEventListener("abort", () => reject(new Error("inner abort")));
  });

describe("buildHybridParams", () => {
  it("passes the mode through", () => {
    expect(buildHybridParams(InferenceMode.PREFER_ON_DEVICE).mode).toBe("prefer_on_device");
  });

  it("uses the default cloud model unless one is given", () => {
    expect(buildHybridParams(InferenceMode.ONLY_IN_CLOUD).inCloudParams?.model).toBe(DEFAULT_CLOUD_MODEL);
    expect(buildHybridParams(InferenceMode.ONLY_IN_CLOUD, { cloudModel: "test-model" }).inCloudParams?.model).toBe(
      "test-model",
    );
  });

  it("tells the on-device model to expect English plus the lesson language", () => {
    const createOptions = buildHybridParams(InferenceMode.PREFER_ON_DEVICE, { language: "ja" }).onDeviceParams?.createOptions;
    expect(createOptions?.expectedInputs).toEqual([{ type: "text", languages: ["en", "ja"] }]);
    expect(createOptions?.expectedOutputs).toEqual([{ type: "text", languages: ["en", "ja"] }]);
  });

  it("expects English only when no language is given or Nano doesn't support it", () => {
    for (const options of [{}, { language: "ko" }]) {
      expect(buildHybridParams(InferenceMode.PREFER_ON_DEVICE, options).onDeviceParams?.createOptions?.expectedInputs).toEqual([
        { type: "text", languages: ["en"] },
      ]);
    }
  });

  it("accepts other languages", () => {
    const createOptions = buildHybridParams(InferenceMode.PREFER_ON_DEVICE, { languages: ["en", "fr"] }).onDeviceParams
      ?.createOptions;
    expect(createOptions?.expectedInputs).toEqual([{ type: "text", languages: ["en", "fr"] }]);
  });

  it("adds the system instruction only when given", () => {
    expect(buildHybridParams(InferenceMode.ONLY_IN_CLOUD).inCloudParams).not.toHaveProperty("systemInstruction");
    expect(
      buildHybridParams(InferenceMode.ONLY_IN_CLOUD, { systemInstruction: "You grade Spanish." }).inCloudParams
        ?.systemInstruction,
    ).toBe("You grade Spanish.");
  });

  it("asks for JSON in the cloud and on-device when a schema is given", () => {
    const schema = { type: "object", properties: { ok: { type: "boolean" } } };
    const params = buildHybridParams(InferenceMode.PREFER_ON_DEVICE, { jsonSchema: schema });
    expect(params.inCloudParams?.generationConfig).toEqual({
      responseMimeType: "application/json",
      responseJsonSchema: schema,
    });
    expect(params.onDeviceParams?.promptOptions).toEqual({ responseConstraint: schema });
  });

  it("asks for no JSON settings without a schema", () => {
    const params = buildHybridParams(InferenceMode.PREFER_ON_DEVICE);
    expect(params.inCloudParams).not.toHaveProperty("generationConfig");
    expect(params.onDeviceParams).not.toHaveProperty("promptOptions");
  });

  it("gives Nano the system instruction as a system prompt", () => {
    const createOptions = buildHybridParams(InferenceMode.PREFER_ON_DEVICE, { systemInstruction: "Grade kindly." }).onDeviceParams
      ?.createOptions;
    expect(createOptions?.initialPrompts).toEqual([{ role: "system", content: [{ type: "text", value: "Grade kindly." }] }]);
  });

  it("skips the system prompt when there's no instruction", () => {
    const createOptions = buildHybridParams(InferenceMode.PREFER_ON_DEVICE).onDeviceParams?.createOptions;
    expect(createOptions).not.toHaveProperty("initialPrompts");
  });
});

describe("createModel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds the params once and hands them to the factory", () => {
    const factory = vi.fn((_params: HybridParams) => fakePort());
    const model = createModel(InferenceMode.ONLY_IN_CLOUD, { cloudModel: "test-model" }, factory);

    expect(model.mode).toBe("only_in_cloud");
    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory.mock.calls[0]?.[0]).toMatchObject({ mode: "only_in_cloud", inCloudParams: { model: "test-model" } });
  });

  it("returns the text and where it ran", async () => {
    const model = createModel(InferenceMode.PREFER_ON_DEVICE, {}, () => fakePort());
    await expect(model.generateText("Hola")).resolves.toEqual({ text: "hola", source: "on_device" });
  });

  it("passes media parts through unchanged", async () => {
    const port = fakePort();
    const parts: ModelRequest = ["Grade this", { type: "inlineData", inlineData: { mimeType: "audio/wav", data: "AAAA" } }];
    await createModel(InferenceMode.ONLY_IN_CLOUD, {}, () => port).generate(parts);
    expect(port.generateContent).toHaveBeenCalledWith(parts, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it("reports an unknown source when the SDK doesn't say", async () => {
    const model = createModel(InferenceMode.PREFER_ON_DEVICE, {}, () => fakePort(async () => fakeResult("hola")));
    await expect(model.generateText("Hola")).resolves.toEqual({ text: "hola", source: undefined });
  });

  it("gives the SDK call an AbortSignal and the default timeout", async () => {
    const port = fakePort();
    await createModel(InferenceMode.PREFER_ON_DEVICE, {}, () => port).generateText("Hola");

    expect(port.generateContent).toHaveBeenCalledWith(
      "Hola",
      expect.objectContaining({ signal: expect.any(AbortSignal), timeout: DEFAULT_TIMEOUT_MS }),
    );
  });

  it("lets one call override the timeout", async () => {
    const port = fakePort();
    await createModel(InferenceMode.PREFER_ON_DEVICE, { timeoutMs: 5000 }, () => port).generateText("Hola", {
      timeoutMs: 2000,
    });

    expect(port.generateContent).toHaveBeenCalledWith("Hola", expect.objectContaining({ timeout: 2000 }));
  });

  it("uses the model's own timeout when the call doesn't set one", async () => {
    const port = fakePort();
    await createModel(InferenceMode.PREFER_ON_DEVICE, { timeoutMs: 5000 }, () => port).generateText("Hola");

    expect(port.generateContent).toHaveBeenCalledWith("Hola", expect.objectContaining({ timeout: 5000 }));
  });

  it("times out a call that hangs", async () => {
    vi.useFakeTimers();
    const model = createModel(InferenceMode.ONLY_IN_CLOUD, {}, () => fakePort(hangUntilAborted));
    const promise = model.generateText("Hola", { timeoutMs: 50 });

    vi.advanceTimersByTime(50);
    await expect(promise).rejects.toBeInstanceOf(AiTimeoutError);
  });

  it("stops when the caller cancels", async () => {
    const controller = new AbortController();
    const model = createModel(InferenceMode.ONLY_IN_CLOUD, {}, () => fakePort(hangUntilAborted));
    const promise = model.generateText("Hola", { signal: controller.signal });

    controller.abort();
    await expect(promise).rejects.toBeInstanceOf(AiAbortedError);
  });

  it("passes SDK errors straight through", async () => {
    const error = new Error("quota exceeded");
    const model = createModel(InferenceMode.ONLY_IN_CLOUD, {}, () => fakePort(() => Promise.reject(error)));
    await expect(model.generateText("Hola")).rejects.toBe(error);
  });
});
