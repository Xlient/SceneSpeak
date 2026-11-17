import { describe, expect, it } from "vitest";
import { askName, goodGradeJson } from "./grade-fixtures";
import { GradeParseError, parseGrade } from "./grade-parse";

const withFields = (fields: Record<string, unknown>) => JSON.stringify({ ...JSON.parse(goodGradeJson), ...fields });

describe("parseGrade", () => {
  it("parses a valid grade", () => {
    expect(parseGrade(goodGradeJson, askName)).toMatchObject({ ok: true, score: 90, errorType: "none" });
  });

  it("strips ```json fences some models add", () => {
    expect(parseGrade("```json\n" + goodGradeJson + "\n```", askName).score).toBe(90);
  });

  it("clamps an out-of-range score", () => {
    expect(parseGrade(withFields({ score: 140 }), askName).score).toBe(100);
  });

  it("drops an unknown errorType to none", () => {
    expect(parseGrade(withFields({ errorType: "spelling" }), askName).errorType).toBe("none");
  });

  it("sets goalId from the line when ok, ignoring what the model said", () => {
    expect(parseGrade(withFields({ goalId: "say-goodbye" }), askName).goalId).toBe("say-name");
  });

  it("sets goalId to null when not ok", () => {
    expect(parseGrade(withFields({ ok: false, goalId: "say-name" }), askName).goalId).toBeNull();
  });

  it("throws GradeParseError for text that isn't JSON", () => {
    expect(() => parseGrade("Great job!", askName)).toThrow(GradeParseError);
  });

  it("throws GradeParseError for JSON with the wrong shape", () => {
    expect(() => parseGrade(JSON.stringify({ score: 50 }), askName)).toThrow(GradeParseError);
  });

  it("keeps the raw text on the error for debugging", () => {
    try {
      parseGrade("nope", askName);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(GradeParseError);
      expect((error as GradeParseError).raw).toBe("nope");
    }
  });
});
