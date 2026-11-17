import { describe, expect, it } from "vitest";
import { goodLessonJson, safeScreenJson } from "@scenespeak/core/ai/lesson-fixtures";
import type { GenerateRequest, HybridModel } from "../ai-port/hybrid-model";
import { createUnavailableModel } from "../ai-port/unavailable-model";
import { createMobileGenerator } from "./mobile-generator";

const request = () => ({
  prompt: "meeting my new neighbour",
  language: "es" as const,
  signal: new AbortController().signal,
  onProgress: () => {},
});

const fakePort = (seen: GenerateRequest[]): HybridModel => ({
  ...createUnavailableModel("unused"),
  generate: (req) => {
    seen.push(req);
    const text = req.schemaId === "screen" ? safeScreenJson : goodLessonJson;
    return Promise.resolve({ text, inferenceSource: req.schemaId === "screen" ? "on_device" : "in_cloud", latencyMs: 5 });
  },
});

describe("createMobileGenerator", () => {
  it("screens on device, writes in the cloud, and returns a parsed lesson", async () => {
    const seen: GenerateRequest[] = [];
    const generate = createMobileGenerator({ port: fakePort(seen), deviceKind: () => "ready", isOnline: () => true });
    const result = await generate(request());
    if (result.kind !== "generated") throw new Error("expected a generated lesson");
    expect(result.lesson.scenario.lines.length).toBeGreaterThan(0);
    expect(seen.map((r) => [r.schemaId, r.mode])).toEqual([
      ["screen", "prefer_on_device"],
      ["lesson", "only_in_cloud"],
    ]);
    expect(seen[1]?.responseSchema).toBeDefined();
  });

  it("screens in the cloud when there's no device model", async () => {
    const seen: GenerateRequest[] = [];
    const generate = createMobileGenerator({ port: fakePort(seen), deviceKind: () => "unavailable", isOnline: () => true });
    await generate(request());
    expect(seen[0]?.mode).toBe("only_in_cloud");
  });
});
