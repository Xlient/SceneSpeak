import { describe, expect, it } from "vitest";
import { DeviceModelInfo, GenerateResult, HybridModelUnavailableError } from "./hybrid-model";
import { createUnavailableModel } from "./unavailable-model";

const options = { signal: new AbortController().signal, timeoutMs: 1000 };

describe("createUnavailableModel", () => {
  it("reports unavailable with the reason and rejects calls", async () => {
    const model = createUnavailableModel("Not built yet");
    await expect(model.status(options)).resolves.toEqual({ status: "unavailable", reason: "Not built yet" });
    await expect(model.generate({ prompt: "hola", mode: "only_on_device" }, options)).rejects.toBeInstanceOf(
      HybridModelUnavailableError,
    );
  });
});

describe("bridge schemas", () => {
  it("drops unknown status values to unavailable", () => {
    expect(DeviceModelInfo.parse({ status: "warming" }).status).toBe("unavailable");
  });

  it("rejects an unknown inference source", () => {
    expect(GenerateResult.safeParse({ text: "x", inferenceSource: "edge", latencyMs: 3 }).success).toBe(false);
  });
});
