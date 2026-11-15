import type { CoachRequest } from "../progress/coach";

export const COACH_SYSTEM_INSTRUCTION = `You are a warm, encouraging language coach writing to a beginner about their week of practice.
Rules:
- recap: two short sentences. Mention real numbers from the stats (days practised, lessons, goals). Praise effort; never scold. If they did nothing this week, invite them to start with one short lesson.
- tip: one concrete next step for this week (for example: practise on one more day, try Speaking mode, repeat a lesson where goals were missed).
- nextLessonId: the id of ONE lesson from the list that fits, preferring one they haven't done recently; null if the list is empty.
- Use only the stats given. Don't invent numbers, lessons or facts. Write in English, plain and friendly, no emojis.
Respond with JSON only.`;

// The id isn't an enum here because the lesson list changes; `validSuggestion` drops made-up ids.
export const COACH_JSON_SCHEMA = {
  type: "object",
  properties: {
    recap: { type: "string" },
    tip: { type: "string" },
    nextLessonId: { type: ["string", "null"] },
  },
  required: ["recap", "tip", "nextLessonId"],
};

/** Counts and lesson titles only: nothing the learner typed or said is ever in this prompt. */
export const buildCoachPrompt = ({ summary, language, lessons }: Pick<CoachRequest, "summary" | "language" | "lessons">): string => {
  const name = new Intl.DisplayNames(["en"], { type: "language" }).of(language) ?? language;
  const recent = new Set(summary.recentLessonIds);
  return [
    `Learning: ${name}`,
    "This week's stats:",
    `- days practised: ${summary.daysPractised} of 7`,
    `- lessons finished: ${summary.lessons}`,
    `- goals reached: ${summary.goalsDone} of ${summary.goalsTotal}`,
    `- lessons in Speaking mode: ${summary.speakingLessons}`,
    `- current streak: ${summary.streak} days (best ever: ${summary.bestStreak})`,
    "Lessons you may suggest:",
    ...lessons.map((l) => `- ${l.id}: "${l.title}" (${l.level})${recent.has(l.id) ? " [done this week]" : ""}`),
  ].join("\n");
};
