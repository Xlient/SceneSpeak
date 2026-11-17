import { describe, expect, it } from "vitest";
import { UnsafeRequestError } from "@scenespeak/core/ai/lesson-generator";
import { AiTimeoutError } from "@scenespeak/core/ai/with-timeout";
import { HybridModelUnavailableError } from "../ai-port/hybrid-model";
import { generateErrorMessage } from "./generate-error-message";

describe("generateErrorMessage", () => {
  it("explains each failure in plain words", () => {
    expect(generateErrorMessage(new UnsafeRequestError("That topic isn't allowed."))).toMatch(/everyday situation/);
    expect(generateErrorMessage(new AiTimeoutError(10))).toMatch(/too long/);
    expect(generateErrorMessage(new HybridModelUnavailableError("x"))).toMatch(/isn't connected/);
    expect(generateErrorMessage(new Error("boom"))).toMatch(/connection/);
  });
});
