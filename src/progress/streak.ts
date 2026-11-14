import { z } from "zod";

/** A calendar day in the learner's own time zone, as YYYY-MM-DD. */
export type DayKey = string;

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export const dayKey = (date: Date): DayKey =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const dayNumber = (key: DayKey) => {
  const [y = 0, m = 1, d = 1] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
};

export const Practice = z.object({
  lastDay: z.string().regex(DAY_KEY).nullable().catch(null),
  streak: z.number().int().min(0).catch(0),
  best: z.number().int().min(0).catch(0),
  lessonsDone: z.number().int().min(0).catch(0),
});
export type Practice = z.infer<typeof Practice>;

export const EMPTY_PRACTICE: Practice = { lastDay: null, streak: 0, best: 0, lessonsDone: 0 };

/** Counts a finished lesson: same day keeps the streak, the next day extends it, a gap restarts it. */
export const recordLesson = (practice: Practice, today: DayKey): Practice => {
  const gap = practice.lastDay === null ? Infinity : dayNumber(today) - dayNumber(practice.lastDay);
  const streak = gap === 0 ? practice.streak : gap === 1 ? practice.streak + 1 : 1;
  return { lastDay: today, streak, best: Math.max(practice.best, streak), lessonsDone: practice.lessonsDone + 1 };
};

/** The streak to show today: still alive if the learner practised today or yesterday. */
export const activeStreak = (practice: Practice, today: DayKey): number => {
  if (practice.lastDay === null) return 0;
  return dayNumber(today) - dayNumber(practice.lastDay) <= 1 ? practice.streak : 0;
};

export const parsePractice = (raw: unknown): Practice => {
  const parsed = Practice.safeParse(raw);
  return parsed.success ? parsed.data : EMPTY_PRACTICE;
};
