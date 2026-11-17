import { describe, expect, it } from "vitest";
import { LessonTemplate } from "./lesson-template";

const valid = {
  id: "ordering-food",
  scene: "cafe",
  level: "A1",
  title: "Ordering food",
  cast: [{ characterId: "waiter", role: "waiter", formality: "formal" }],
  goals: [
    { id: "g1", intent: "greet" },
    { id: "g2", intent: "order_item" },
    { id: "g3", intent: "ask_bill" },
  ],
};

describe("LessonTemplate", () => {
  it("parses a valid template", () => {
    expect(LessonTemplate.parse(valid)).toEqual(valid);
  });

  it("rejects a template with no known intents", () => {
    expect(LessonTemplate.safeParse({ ...valid, goals: [{ id: "g1", intent: "juggle" }] }).success).toBe(false);
  });

  it("rejects a missing scene", () => {
    const { scene: _scene, ...rest } = valid;
    expect(LessonTemplate.safeParse(rest).success).toBe(false);
  });

  it("drops goals with unknown intents", () => {
    const parsed = LessonTemplate.parse({ ...valid, goals: [...valid.goals, { id: "g4", intent: "juggle" }] });
    expect(parsed.goals.map((g) => g.intent)).toEqual(["greet", "order_item", "ask_bill"]);
  });

  it("caps goals at four and cast at three", () => {
    const parsed = LessonTemplate.parse({
      ...valid,
      cast: Array.from({ length: 4 }, (_, i) => ({ characterId: `c${i}`, role: "r", formality: "casual" })),
      goals: Array.from({ length: 6 }, (_, i) => ({ id: `g${i}`, intent: "greet" })),
    });
    expect(parsed.goals).toHaveLength(4);
    expect(parsed.cast).toHaveLength(3);
  });

  it("falls back to formal for an unknown formality", () => {
    const parsed = LessonTemplate.parse({ ...valid, cast: [{ characterId: "w", role: "waiter", formality: "rude" }] });
    expect(parsed.cast[0]?.formality).toBe("formal");
  });
});
