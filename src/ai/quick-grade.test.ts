import { describe, expect, it } from "vitest";
import { askName, lineById } from "./grade-fixtures";
import { normalizeReply, quickGrade } from "./quick-grade";

describe("normalizeReply", () => {
  it("ignores case, accents, punctuation and extra spaces", () => {
    expect(normalizeReply("  ¡Hola!   Sí, soy NUEVO. ")).toBe("hola si soy nuevo");
  });
});

describe("quickGrade", () => {
  it("gives a perfect grade, with no model call needed, when the reply matches the example", () => {
    expect(quickGrade(lineById("l2"), "hola si soy nuevo")).toEqual({
      ok: true,
      meaningMatches: true,
      score: 100,
      correction: null,
      hint: null,
      goalId: "greet",
      errorType: "none",
    });
  });

  it("returns null when the reply differs, so the model decides", () => {
    expect(quickGrade(askName, "Me llamo Sam")).toBeNull();
  });

  it("returns null for an empty reply", () => {
    expect(quickGrade(askName, "  ¿? ")).toBeNull();
  });
});
