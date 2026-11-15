import { describe, expect, it } from "vitest";
import { LEARNER_SPEAKER } from "../schemas";
import { MEET_THE_NEIGHBOUR as scenario } from "./featured/meet-the-neighbour";
import type { Attempt } from "./lesson-progress";
import { scoreLesson } from "./scoring";

const goalLines = scenario.lines.filter((l) => l.speaker === LEARNER_SPEAKER && l.expects !== null);
const tryAt = (index: number, score: number, ok = score >= 60): Attempt => ({ lineId: goalLines[index]?.id ?? "?", score, ok });
const perfect = goalLines.map((_, i) => tryAt(i, 95));

describe("scoreLesson", () => {
  it("gives three stars and full XP for a clean run", () => {
    expect(goalLines).toHaveLength(4);
    expect(scoreLesson(scenario, perfect)).toEqual({
      stars: 3,
      xp: 4 * 10 + 4 * 5 + 20,
      goalsDone: 4,
      goalsTotal: 4,
      firstTryGoals: 4,
      accuracy: 95,
      review: [],
    });
  });

  it("adds a bonus for Speaking mode", () => {
    expect(scoreLesson(scenario, perfect, { speaking: true }).xp).toBe(scoreLesson(scenario, perfect).xp + 10);
  });

  it("counts a goal reached on a retry, without the first-try bonus, and lists it for review", () => {
    const score = scoreLesson(scenario, [tryAt(0, 30), tryAt(0, 90), ...perfect.slice(1)]);
    expect(score).toMatchObject({ goalsDone: 4, firstTryGoals: 3, stars: 2, xp: 40 + 15 + 20 });
    expect(score.accuracy).toBe(Math.round((30 + 95 * 3) / 4));
    expect(score.review.map((r) => r.lineId)).toEqual([goalLines[0]?.id]);
  });

  it("puts a shaky pass and skipped lines on the review list", () => {
    const score = scoreLesson(scenario, [tryAt(0, 65, true), tryAt(1, 95)]);
    expect(score).toMatchObject({ goalsDone: 2, stars: 2, xp: 20 + 10 });
    expect(score.review.map((r) => r.lineId)).toEqual([goalLines[0]?.id, goalLines[2]?.id, goalLines[3]?.id]);
    expect(score.review[0]).toMatchObject({ text: goalLines[0]?.text, translation: goalLines[0]?.translation });
  });

  it("gives one star for under half the goals and none for nothing", () => {
    expect(scoreLesson(scenario, [tryAt(0, 90)]).stars).toBe(1);
    expect(scoreLesson(scenario, [])).toMatchObject({ stars: 0, xp: 0, accuracy: null });
    expect(scoreLesson(scenario, [tryAt(0, 20)])).toMatchObject({ stars: 0, xp: 0, goalsDone: 0 });
  });
});
