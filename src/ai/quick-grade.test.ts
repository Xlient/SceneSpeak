import { describe, expect, it } from "vitest";
import { askName, lineById } from "./grade-fixtures";
import type { Grade } from "../schemas";
import { PARTIAL_REPLY_MAX_SCORE, capPartialReply, isPartialReply, normalizeReply, quickGrade } from "./quick-grade";

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

describe("capPartialReply", () => {
  const greet = { ...askName, text: "¡Hola! Sí, soy nuevo." };
  const grade = (overrides: Partial<Grade> = {}): Grade => ({
    ok: true, meaningMatches: false, score: 90, correction: null, hint: "Nice greeting!", goalId: "greet", errorType: "none", ...overrides,
  });

  it("flags replies under half the example's length", () => {
    expect(isPartialReply(greet, "Hola.")).toBe(true);
    expect(isPartialReply(greet, "Hola, soy nuevo")).toBe(false);
  });

  it("ignores short examples", () => {
    expect(isPartialReply({ ...greet, text: "¡Hola!" }, "Hola")).toBe(false);
  });

  it("caps the score but keeps the pass and the model's feedback", () => {
    const capped = capPartialReply(grade(), greet, "Hola.");
    expect(capped).toMatchObject({ ok: true, score: PARTIAL_REPLY_MAX_SCORE, hint: "Nice greeting!", correction: greet.text });
  });

  it("falls back to a hint with the full sentence when the model gave none", () => {
    expect(capPartialReply(grade({ hint: null }), greet, "Hola.").hint).toContain(greet.text);
  });

  it("leaves failed, low or complete replies alone", () => {
    expect(capPartialReply(grade({ ok: false }), greet, "Hola.").score).toBe(90);
    expect(capPartialReply(grade({ score: 60 }), greet, "Hola.").score).toBe(60);
    expect(capPartialReply(grade(), greet, "Hola, sí, soy nuevo").score).toBe(90);
  });
});
