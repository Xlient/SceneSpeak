import { type DayKey, type Practice, activeStreak, dayNumber } from "./streak";

export interface WeekDay {
  day: DayKey;
  lessons: number;
}

const keyOf = (n: number): DayKey => {
  const date = new Date(n * 86_400_000);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
};

/** The last seven days, oldest first, ending today. */
export const weekStrip = (practice: Practice, today: DayKey): WeekDay[] => {
  const end = dayNumber(today);
  return Array.from({ length: 7 }, (_, i) => {
    const day = keyOf(end - 6 + i);
    return { day, lessons: practice.history.find((d) => d.day === day)?.lessons ?? 0 };
  });
};

export interface WeeklySummary {
  daysPractised: number;
  lessons: number;
  goalsDone: number;
  goalsTotal: number;
  speakingLessons: number;
  streak: number;
  bestStreak: number;
  /** Most recent last, no repeats. */
  recentLessonIds: string[];
}

/** What the coach (and later the weekly leaderboard) needs: counts only, nothing the learner typed or said. */
export const weeklySummary = (practice: Practice, today: DayKey): WeeklySummary => {
  const start = dayNumber(today) - 6;
  const week = practice.history.filter((d) => dayNumber(d.day) >= start && dayNumber(d.day) <= dayNumber(today));
  const sum = (pick: (d: (typeof week)[number]) => number) => week.reduce((total, d) => total + pick(d), 0);
  const recent = week.flatMap((d) => d.lessonIds);
  return {
    daysPractised: week.filter((d) => d.lessons > 0).length,
    lessons: sum((d) => d.lessons),
    goalsDone: sum((d) => d.goalsDone),
    goalsTotal: sum((d) => d.goalsTotal),
    speakingLessons: sum((d) => d.speaking),
    streak: activeStreak(practice, today),
    bestStreak: practice.best,
    recentLessonIds: recent.filter((id, i) => recent.lastIndexOf(id) === i),
  };
};
