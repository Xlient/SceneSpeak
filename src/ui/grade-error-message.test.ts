import { describe, expect, it } from "vitest";
import { FirebaseConfigError } from "../ai/config";
import { GradeParseError } from "../ai/grade-parse";
import { AiTimeoutError } from "../ai/with-timeout";
import { GraderUnavailableError } from "../lesson/grader";
import { gradeErrorMessage } from "./grade-error-message";

describe("gradeErrorMessage", () => {
  it("explains timeouts", () => {
    expect(gradeErrorMessage(new AiTimeoutError(15_000))).toMatch(/too long/);
  });

  it("hides raw parse details from the learner", () => {
    const message = gradeErrorMessage(new GradeParseError("Grade validation failed: score", "{}"));
    expect(message).not.toMatch(/validation|score/);
  });

  it("says when AI isn't configured", () => {
    expect(gradeErrorMessage(new FirebaseConfigError(["VITE_FIREBASE_API_KEY"]))).toMatch(/isn't set up/);
  });

  it("keeps not-connected messages as written", () => {
    expect(gradeErrorMessage(new GraderUnavailableError())).toBe("Grading isn't connected yet.");
  });

  it("falls back to a generic message for anything else", () => {
    expect(gradeErrorMessage(new Error("AI/fetch-error: 403"))).toMatch(/Grading failed/);
    expect(gradeErrorMessage("weird")).toMatch(/Grading failed/);
  });
});
