import { describe, expect, it } from "vitest";
import { Grade } from "./grade";

const valid = {
  ok: true,
  meaningMatches: true,
  score: 87,
  correction: null,
  hint: "Try adding 'por favor'.",
  goalId: "greet",
  errorType: "politeness",
};

describe("Grade", () => {
  it("parses a valid grade", () => {
    expect(Grade.parse(valid)).toEqual(valid);
  });

  it("strips unknown keys", () => {
    expect(Grade.parse({ ...valid, extra: "x" })).not.toHaveProperty("extra");
  });

  it("rejects a missing ok flag", () => {
    const { ok: _ok, ...rest } = valid;
    expect(Grade.safeParse(rest).success).toBe(false);
  });

  it("rejects a non-boolean meaningMatches", () => {
    expect(Grade.safeParse({ ...valid, meaningMatches: "yes" }).success).toBe(false);
  });

  it("rejects a non-numeric score", () => {
    expect(Grade.safeParse({ ...valid, score: "high" }).success).toBe(false);
    expect(Grade.safeParse({ ...valid, score: Number.NaN }).success).toBe(false);
  });

  it.each([
    [150, 100],
    [-20, 0],
    [72.6, 73],
    ["64", 64],
  ])("clamps score %s to %s", (input, expected) => {
    expect(Grade.parse({ ...valid, score: input }).score).toBe(expected);
  });

  it("falls back to none for an unknown errorType", () => {
    expect(Grade.parse({ ...valid, errorType: "spelling" }).errorType).toBe("none");
  });

  it("normalises missing or blank hint and correction to null", () => {
    const { hint: _hint, ...rest } = valid;
    const parsed = Grade.parse({ ...rest, correction: "   " });
    expect(parsed.hint).toBeNull();
    expect(parsed.correction).toBeNull();
  });

  it("truncates an overlong correction", () => {
    expect(Grade.parse({ ...valid, correction: "a".repeat(500) }).correction).toHaveLength(200);
  });

  it("drops an invalid goalId to null", () => {
    expect(Grade.parse({ ...valid, goalId: "Not An Id!" }).goalId).toBeNull();
    const { goalId: _goalId, ...rest } = valid;
    expect(Grade.parse(rest).goalId).toBeNull();
  });
});
