import { describe, expect, it } from "vitest";
import { Scenario } from "./scenario";

const line = (i: number, expects: string | null = null) => ({
  id: `l${i}`,
  speaker: "barista",
  text: "¡Hola! ¿Qué te pongo?",
  translation: "Hi! What can I get you?",
  animation: "wave",
  expects,
});

const valid = {
  id: "cafe-order-1",
  language: "es",
  level: "A1",
  title: "Ordering coffee",
  setting: "A small café in Madrid on a sunny morning.",
  cast: [{ characterId: "barista", role: "barista", name: "Lucía" }],
  goals: [{ id: "order", description: "Order a drink" }],
  vocab: [{ word: "café con leche", meaning: "coffee with milk" }],
  lines: [line(1), line(2, "order")],
};

describe("Scenario", () => {
  it("parses a valid scenario", () => {
    expect(Scenario.parse(valid)).toEqual(valid);
  });

  it("rejects a bad language code", () => {
    expect(Scenario.safeParse({ ...valid, language: "Spanish" }).success).toBe(false);
  });

  it("rejects empty cast, goals or lines", () => {
    expect(Scenario.safeParse({ ...valid, cast: [] }).success).toBe(false);
    expect(Scenario.safeParse({ ...valid, goals: [] }).success).toBe(false);
    expect(Scenario.safeParse({ ...valid, lines: [] }).success).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(Scenario.safeParse({ ...valid, title: "  " }).success).toBe(false);
  });

  it("caps cast, goals, vocab and lines", () => {
    const parsed = Scenario.parse({
      ...valid,
      cast: Array.from({ length: 5 }, (_, i) => ({ characterId: `c${i}`, role: "guest", name: `N${i}` })),
      goals: Array.from({ length: 6 }, (_, i) => ({ id: `g${i}`, description: "do a thing" })),
      vocab: Array.from({ length: 20 }, (_, i) => ({ word: `w${i}`, meaning: "m" })),
      lines: Array.from({ length: 30 }, (_, i) => line(i)),
    });
    expect(parsed.cast).toHaveLength(3);
    expect(parsed.goals).toHaveLength(4);
    expect(parsed.vocab).toHaveLength(12);
    expect(parsed.lines).toHaveLength(20);
  });

  it("defaults missing vocab to an empty list", () => {
    const { vocab: _vocab, ...rest } = valid;
    expect(Scenario.parse(rest).vocab).toEqual([]);
  });

  it("falls back for unknown animation and level", () => {
    const parsed = Scenario.parse({ ...valid, level: "Z9", lines: [{ ...line(1), animation: "dance" }] });
    expect(parsed.level).toBe("A1");
    expect(parsed.lines[0]?.animation).toBe("idle");
  });

  it("clears expects that point at an unknown goal", () => {
    const parsed = Scenario.parse({ ...valid, lines: [line(1, "missing-goal")] });
    expect(parsed.lines[0]?.expects).toBeNull();
  });

  it("truncates overlong line text", () => {
    const parsed = Scenario.parse({ ...valid, lines: [{ ...line(1), text: "x".repeat(400) }] });
    expect(parsed.lines[0]?.text).toHaveLength(300);
  });
});
