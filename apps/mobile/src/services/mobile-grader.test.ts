import { describe, expect, it, vi } from "vitest";
import { FEATURED_LESSONS } from "@scenespeak/core/lesson/featured/featured-lessons";
import { LEARNER_SPEAKER } from "@scenespeak/core/schemas";
import type { GenerateRequest, HybridModel } from "../ai-port/hybrid-model";
import { HybridModelUnavailableError } from "../ai-port/hybrid-model";
import { createUnavailableModel } from "../ai-port/unavailable-model";
import { gradeErrorMessage } from "./grade-error-message";
import { createMobileGrader, toDeviceKind } from "./mobile-grader";

const lesson = FEATURED_LESSONS[0];
if (!lesson) throw new Error("No featured lesson");
const scenario = lesson.scenario;
const line = scenario.lines.find((l) => l.speaker === LEARNER_SPEAKER);
if (!line) throw new Error("No learner line");
const signal = new AbortController().signal;

const fakePort = (text: string, onGenerate?: (request: GenerateRequest) => void): HybridModel => ({
  ...createUnavailableModel("unused"),
  generate: (request) => {
    onGenerate?.(request);
    return Promise.resolve({ text, inferenceSource: "on_device", latencyMs: 5 });
  },
});

const grade = { ok: true, meaningMatches: true, score: 80, correction: null, hint: null, goalId: line.expects, errorType: "none" };

describe("createMobileGrader", () => {
  it("accepts the exact example phrase without calling the model", async () => {
    const generate = vi.fn();
    const grader = createMobileGrader({ port: fakePort("", generate), deviceKind: () => "ready", isOnline: () => true });
    const result = await grader({ scenario, line, reply: line.text, signal });
    expect(result.grade.score).toBe(100);
    expect(generate).not.toHaveBeenCalled();
  });

  it("asks the port with the routed mode and the grade schema, and parses its JSON", async () => {
    const seen: GenerateRequest[] = [];
    const grader = createMobileGrader({
      port: fakePort(JSON.stringify(grade), (r) => seen.push(r)),
      deviceKind: () => "ready",
      isOnline: () => true,
    });
    const result = await grader({ scenario, line, reply: "algo diferente", signal });
    expect(result.grade.ok).toBe(true);
    expect(result.source).toBe("on_device");
    expect(result.route).toBeTruthy();
    expect(seen[0]?.schemaId).toBe("grade");
  });

  it("surfaces the unconnected port as a friendly message", async () => {
    const grader = createMobileGrader({ port: createUnavailableModel("x"), deviceKind: () => "unavailable", isOnline: () => true });
    const error: unknown = await grader({ scenario, line, reply: "algo diferente", signal }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HybridModelUnavailableError);
    expect(gradeErrorMessage(error)).toMatch(/isn't connected/);
  });
});

describe("toDeviceKind", () => {
  it("maps port statuses to the routing policy's device kinds", () => {
    expect(toDeviceKind({ status: "available" })).toBe("ready");
    expect(toDeviceKind({ status: "unavailable" })).toBe("unavailable");
  });
});

describe("gradeErrorMessage for voice", () => {
  it("points spoken replies to typing, since exact matches only work when typed", () => {
    expect(gradeErrorMessage(new HybridModelUnavailableError("x"), "voice")).toMatch(/Type instead/);
  });
});
