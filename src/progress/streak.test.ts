import { describe, expect, it } from "vitest";
import { EMPTY_PRACTICE, activeStreak, dayKey, parsePractice, recordLesson } from "./streak";

describe("dayKey", () => {
  it("uses the local calendar day", () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("recordLesson", () => {
  it("starts a streak on the first lesson", () => {
    expect(recordLesson(EMPTY_PRACTICE, "2026-11-14")).toMatchObject({ lastDay: "2026-11-14", streak: 1, best: 1, lessonsDone: 1 });
  });

  it("keeps the streak for a second lesson on the same day", () => {
    const once = recordLesson(EMPTY_PRACTICE, "2026-11-14");
    expect(recordLesson(once, "2026-11-14")).toMatchObject({ streak: 1, lessonsDone: 2 });
  });

  it("extends on the next day, across a month end", () => {
    const day1 = recordLesson(EMPTY_PRACTICE, "2026-11-30");
    expect(recordLesson(day1, "2026-12-01")).toMatchObject({ streak: 2, best: 2 });
  });

  it("restarts after a missed day but keeps the best", () => {
    const two = recordLesson(recordLesson(EMPTY_PRACTICE, "2026-11-10"), "2026-11-11");
    expect(recordLesson(two, "2026-11-13")).toMatchObject({ streak: 1, best: 2 });
  });
});

describe("history", () => {
  const lesson = (id: string, speaking = false) => ({ lessonId: id, goalsDone: 2, goalsTotal: 3, speaking });

  it("adds up lessons, goals and speaking lessons per day", () => {
    const day = recordLesson(recordLesson(EMPTY_PRACTICE, "2026-11-14", lesson("cafe")), "2026-11-14", lesson("bakery", true));
    expect(day.history).toEqual([{ day: "2026-11-14", lessons: 2, goalsDone: 4, goalsTotal: 6, speaking: 1, lessonIds: ["cafe", "bakery"] }]);
  });

  it("forgets days older than four weeks", () => {
    const old = recordLesson(EMPTY_PRACTICE, "2026-10-01", lesson("a"));
    expect(recordLesson(old, "2026-11-14", lesson("b")).history.map((d) => d.day)).toEqual(["2026-11-14"]);
  });
});

describe("activeStreak", () => {
  const practice = recordLesson(EMPTY_PRACTICE, "2026-11-14");

  it("is alive today and tomorrow, then lapses", () => {
    expect(activeStreak(practice, "2026-11-14")).toBe(1);
    expect(activeStreak(practice, "2026-11-15")).toBe(1);
    expect(activeStreak(practice, "2026-11-16")).toBe(0);
  });
});

describe("parsePractice", () => {
  it("falls back to empty for garbage and repairs bad fields", () => {
    expect(parsePractice("nope")).toEqual(EMPTY_PRACTICE);
    expect(parsePractice({ lastDay: "yesterday", streak: -3, best: 2, lessonsDone: 1.5 })).toEqual({ lastDay: null, streak: 0, best: 2, lessonsDone: 0, history: [] });
  });

  it("keeps valid history days, sorted, and drops broken ones", () => {
    const parsed = parsePractice({
      lastDay: "2026-11-14",
      streak: 1,
      best: 1,
      lessonsDone: 1,
      history: [{ day: "2026-11-14", lessons: 1, goalsDone: 2, goalsTotal: 3, speaking: 0, lessonIds: ["a"] }, { day: "nope" }, { day: "2026-11-01", lessons: 1 }],
    });
    expect(parsed.history.map((d) => d.day)).toEqual(["2026-11-01", "2026-11-14"]);
  });
});
