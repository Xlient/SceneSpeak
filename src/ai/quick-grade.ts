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
