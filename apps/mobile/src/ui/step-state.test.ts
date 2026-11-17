import { describe, expect, it } from "vitest";
import { stepState } from "./step-state";

describe("stepState", () => {
  it("marks earlier steps done, the current one active or failed, later ones pending", () => {
    expect(stepState(0, 1, false)).toBe("done");
    expect(stepState(1, 1, false)).toBe("active");
    expect(stepState(1, 1, true)).toBe("failed");
    expect(stepState(2, 1, false)).toBe("pending");
  });
});
