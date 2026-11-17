import { describe, expect, it } from "vitest";
import { UnsafeRequestError } from "@scenespeak/core/ai/lesson-generator";
import { LessonParseError } from "@scenespeak/core/ai/lesson-parse";
import { AiTimeoutError } from "@scenespeak/core/ai/with-timeout";
import { GeneratorUnavailableError } from "@scenespeak/core/lesson/generator";
import { generateErrorMessage } from "./generate-error-message";

describe("generateErrorMessage", () => {
  it("passes on the screen's reason for unsafe requests", () => {
    expect(generateErrorMessage(new UnsafeRequestError("Not family friendly."))).toMatch(/^Not family friendly\./);
  });

  it("hides parse problems behind a friendly message", () => {
    const message = generateErrorMessage(new LessonParseError(["scenario.lines: required"], "{}"));
    expect(message).not.toContain("scenario.lines");
  });

  it("explains timeouts", () => {
    expect(generateErrorMessage(new AiTimeoutError(60_000))).toMatch(/too long/);
  });

  it("shows the not-connected message as is", () => {
    const error = new GeneratorUnavailableError();
    expect(generateErrorMessage(error)).toBe(error.message);
  });

  it("falls back for anything else", () => {
    expect(generateErrorMessage(new Error("boom"))).toMatch(/connection/);
  });
});
