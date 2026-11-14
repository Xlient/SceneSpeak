import { z } from "zod";
import { Grade, type Line } from "../schemas";

export class GradeParseError extends Error {
  override readonly name = "GradeParseError";

  constructor(
    message: string,
    readonly raw: string,
  ) {
    super(message);
  }
}

export const parseGrade = (raw: string, line: Line): Grade => {
  const stripped = raw.replace(/^\s*```(?:json)?\s*/, "").replace(/\s*```\s*$/, "");
  const parsed = ((): unknown => {
    try {
      return JSON.parse(stripped);
    } catch (error) {
      throw new GradeParseError(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`, raw);
    }
  })();

  const result = Grade.safeParse(parsed);
  if (!result.success) {
    throw new GradeParseError(`Grade validation failed:\n${z.prettifyError(result.error)}`, raw);
  }

  // The lesson already knows which goal this line tests; don't trust the model's guess.
  return { ...result.data, goalId: result.data.ok ? line.expects : null };
};
