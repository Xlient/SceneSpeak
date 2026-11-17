import { describe, expect, it } from "vitest";
import { EMPTY_PRACTICE, recordLesson } from "./streak";
import { weekStrip, weeklySummary } from "./weekly";

const lesson = (id: string, speaking = false) => ({ lessonId: id, goalsDone: 2, goalsTotal: 3, speaking });

const practice = [
  ["2026-11-05", lesson("old")],
  ["2026-11-10", lesson("cafe")],
  ["2026-11-12", lesson("bakery", true)],
  ["2026-11-14", lesson("cafe")],
] as const;
const history = practice.reduce((p, [day, l]) => recordLesson(p, day, l), EMPTY_PRACTICE);

describe("weekStrip", () => {
  it("lists the last seven days ending today, across a month end", () => {
    const strip = weekStrip(history, "2026-11-14");
    expect(strip.map((d) => d.day)).toEqual(["2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14"]);
    expect(strip.map((d) => d.lessons)).toEqual([0, 0, 1, 0, 1, 0, 1]);
    expect(weekStrip(EMPTY_PRACTICE, "2026-12-02")[0]?.day).toBe("2026-11-26");
  });
});

describe("weeklySummary", () => {
  it("counts only this week, with recent lessons deduplicated", () => {
    expect(weeklySummary(history, "2026-11-14")).toEqual({
      daysPractised: 3,
      lessons: 3,
      goalsDone: 6,
      goalsTotal: 9,
      speakingLessons: 1,
      streak: 1,
      bestStreak: 1,
      recentLessonIds: ["bakery", "cafe"],
    });
  });

  it("is all zeros for a new learner", () => {
    expect(weeklySummary(EMPTY_PRACTICE, "2026-11-14")).toMatchObject({ daysPractised: 0, lessons: 0, streak: 0, recentLessonIds: [] });
  });
});
