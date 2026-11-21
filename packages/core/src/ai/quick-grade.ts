import type { Grade, Line } from "../schemas";

// Scripts written without spaces between words.
const UNSPACED = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu;
const SPACE_BY_UNSPACED = /\s+(?=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])|(?<=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])\s+/gu;

export const normalizeReply = (text: string): string =>
  // NFKD folds full-width forms and splits "í" into "i" + accent. Only Latin-style accents (U+0300–036F) are dropped,
  // so kana voicing marks and other scripts' vowel signs survive; NFC then rejoins them.
  text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .replace(SPACE_BY_UNSPACED, "")
    .trim();

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

/** Words for spaced scripts; Han and kana count as one word per two characters. */
const wordCount = (text: string): number => {
  const normalized = normalizeReply(text);
  const unspaced = normalized.match(UNSPACED)?.length ?? 0;
  const rest = normalized.replace(UNSPACED, " ").trim();
  return (rest === "" ? 0 : rest.split(/\s+/).length) + Math.ceil(unspaced / 2);
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
