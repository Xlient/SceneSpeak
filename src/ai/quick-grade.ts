import type { Grade, Line } from "../schemas";

export const normalizeReply = (text: string): string => {
  // NFD splits "í" into "i" + accent mark; strip marks (\p{M}), lowercase, drop punctuation, squash spaces

  return text.normalize("NFD")
  .replace(/\p{M}/gu, "")
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s]/gu, "")
  .replace(/\s+/g, " ")
  .trim();
  
};

export const quickGrade = (line: Line, reply: string): Grade | null => {
  // empty or different from normalizeReply(line.text) → null; otherwise a perfect Grade
  const normalizedReply = normalizeReply(reply);
  const normalizedLineText = normalizeReply(line.text);

  if (normalizedReply === "" || normalizedReply !== normalizedLineText) {
    return null;
  }

  const grade: Grade = {
    ok: true,
    score: 100,
    meaningMatches: true,
    correction: null,
    hint: null,
    goalId: line.expects,
    errorType: "none"
  };

  return grade;
};

/** Replies under half the example's length still pass, but can't score as "natural and complete". */
export const PARTIAL_REPLY_MAX_SCORE = 75;
const MIN_EXAMPLE_WORDS = 3;

const wordCount = (text: string): number => {
  const normalized = normalizeReply(text);
  return normalized === "" ? 0 : normalized.split(" ").length;
};

export const isPartialReply = (line: Line, reply: string): boolean => {
  const expected = wordCount(line.text);
  return expected >= MIN_EXAMPLE_WORDS && wordCount(reply) * 2 < expected;
};

export const capPartialReply = (grade: Grade, line: Line, reply: string): Grade => {
  if (!grade.ok || !isPartialReply(line, reply) || grade.score <= PARTIAL_REPLY_MAX_SCORE) return grade;
  return {
    ...grade,
    score: PARTIAL_REPLY_MAX_SCORE,
    correction: grade.correction ?? line.text,
    // The model writes the feedback (device-first for text); this is only a fallback.
    hint: grade.hint ?? `That works! For a fuller answer, try: "${line.text}"`,
  };
};
