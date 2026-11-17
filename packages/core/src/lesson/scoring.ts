import { LEARNER_SPEAKER, type Scenario } from "../schemas";
import type { Attempt } from "./lesson-progress";

export const XP_PER_GOAL = 10;
export const XP_FIRST_TRY_BONUS = 5;
export const XP_ALL_GOALS_BONUS = 20;
export const XP_SPEAKING_BONUS = 10;
/** A first try below this goes on the review list even if it passed. */
export const REVIEW_BELOW_SCORE = 70;

export interface ReviewPhrase {
  lineId: string;
  text: string;
  translation: string;
}

export interface LessonScore {
  /** 0–3. */
  stars: number;
  xp: number;
  goalsDone: number;
  goalsTotal: number;
  firstTryGoals: number;
  /** Average first-try score across attempted lines, 0–100; null when nothing was attempted. */
  accuracy: number | null;
  review: ReviewPhrase[];
}

const starsFor = (goalsDone: number, goalsTotal: number, accuracy: number | null): number => {
  if (goalsDone === 0 || goalsTotal === 0) return 0;
  if (goalsDone < goalsTotal) return goalsDone / goalsTotal >= 0.5 ? 2 : 1;
  return (accuracy ?? 0) >= 80 ? 3 : 2;
};

/** Scores a finished lesson from its graded tries. First tries decide accuracy; any passing try reaches the goal. */
export const scoreLesson = (scenario: Scenario, attempts: readonly Attempt[], options: { speaking?: boolean } = {}): LessonScore => {
  const goalLines = scenario.lines.filter((line) => line.speaker === LEARNER_SPEAKER && line.expects !== null);
  let goalsDone = 0;
  let firstTryGoals = 0;
  const firstScores: number[] = [];
  const review: ReviewPhrase[] = [];

  for (const line of goalLines) {
    const tries = attempts.filter((a) => a.lineId === line.id);
    const first = tries[0];
    const passed = tries.some((a) => a.ok);
    if (passed) goalsDone += 1;
    if (first?.ok) firstTryGoals += 1;
    if (first) firstScores.push(first.score);
    if (!first || !first.ok || first.score < REVIEW_BELOW_SCORE) review.push({ lineId: line.id, text: line.text, translation: line.translation });
  }

  const goalsTotal = goalLines.length;
  const accuracy = firstScores.length === 0 ? null : Math.round(firstScores.reduce((a, b) => a + b, 0) / firstScores.length);
  const allGoals = goalsTotal > 0 && goalsDone === goalsTotal;
  const xp =
    goalsDone * XP_PER_GOAL +
    firstTryGoals * XP_FIRST_TRY_BONUS +
    (allGoals ? XP_ALL_GOALS_BONUS : 0) +
    (options.speaking && goalsDone > 0 ? XP_SPEAKING_BONUS : 0);

  return { stars: starsFor(goalsDone, goalsTotal, accuracy), xp, goalsDone, goalsTotal, firstTryGoals, accuracy, review };
};
