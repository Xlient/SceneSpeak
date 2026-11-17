import { z } from "zod";

/** A calendar day in the learner's own time zone, as YYYY-MM-DD. */
export type DayKey = string;

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export const dayKey = (date: Date): DayKey =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const dayNumber = (key: DayKey) => {
  const [y = 0, m = 1, d = 1] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
};

export const HISTORY_DAYS = 28;
const count = z.number().int().min(0).catch(0);

export const DayEntry = z.object({
  day: z.string().regex(DAY_KEY),
  lessons: count,
  goalsDone: count,
  goalsTotal: count,
  speaking: count,
  lessonIds: z.array(z.string().max(64)).max(20).catch([]),
});
export type DayEntry = z.infer<typeof DayEntry>;

const keepValidDays = z
  .array(z.unknown())
  .catch([])
  .transform((items) =>
    items
      .flatMap((item) => {
        const parsed = DayEntry.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      })
      .toSorted((a, b) => a.day.localeCompare(b.day))
      .slice(-HISTORY_DAYS),
  );

export const Practice = z.object({
  lastDay: z.string().regex(DAY_KEY).nullable().catch(null),
  streak: count,
  best: count,
  lessonsDone: count,
  /** Total points earned, from lesson scoring. */
  xp: count,
  /** One entry per practised day, last four weeks only. Stays on this device. */
  history: keepValidDays.default([]),
});
export type Practice = z.infer<typeof Practice>;

export const EMPTY_PRACTICE: Practice = { lastDay: null, streak: 0, best: 0, lessonsDone: 0, xp: 0, history: [] };

export interface FinishedLesson {
  lessonId: string;
  goalsDone: number;
  goalsTotal: number;
  speaking: boolean;
  xp?: number;
}

const addToHistory = (history: readonly DayEntry[], today: DayKey, lesson: FinishedLesson | undefined): DayEntry[] => {
  const current = history.find((d) => d.day === today) ?? { day: today, lessons: 0, goalsDone: 0, goalsTotal: 0, speaking: 0, lessonIds: [] };
  const updated: DayEntry = {
    day: today,
    lessons: current.lessons + 1,
    goalsDone: current.goalsDone + (lesson?.goalsDone ?? 0),
    goalsTotal: current.goalsTotal + (lesson?.goalsTotal ?? 0),
    speaking: current.speaking + (lesson?.speaking ? 1 : 0),
    lessonIds: lesson ? [...current.lessonIds, lesson.lessonId].slice(-20) : current.lessonIds,
  };
  const cutoff = dayNumber(today) - HISTORY_DAYS + 1;
  return [...history.filter((d) => d.day !== today && dayNumber(d.day) >= cutoff), updated].toSorted((a, b) => a.day.localeCompare(b.day));
};

/** Counts a finished lesson: same day keeps the streak, the next day extends it, a gap restarts it. */
export const recordLesson = (practice: Practice, today: DayKey, lesson?: FinishedLesson): Practice => {
  const gap = practice.lastDay === null ? Infinity : dayNumber(today) - dayNumber(practice.lastDay);
  const streak = gap === 0 ? practice.streak : gap === 1 ? practice.streak + 1 : 1;
  return {
    lastDay: today,
    streak,
    best: Math.max(practice.best, streak),
    lessonsDone: practice.lessonsDone + 1,
    xp: practice.xp + Math.max(0, Math.round(lesson?.xp ?? 0)),
    history: addToHistory(practice.history, today, lesson),
  };
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
