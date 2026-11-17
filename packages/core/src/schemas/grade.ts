import { z } from "zod";
import { Id, clampedInt, nullableText } from "./primitives";

export const ERROR_TYPES = ["none", "grammar", "vocab", "politeness", "off-topic"] as const;

export const ErrorType = z.enum(ERROR_TYPES);
export type ErrorType = z.infer<typeof ErrorType>;

export const Grade = z.object({
  ok: z.boolean(),
  meaningMatches: z.boolean(),
  score: clampedInt(0, 100),
  correction: nullableText(200),
  hint: nullableText(200),
  goalId: Id.nullable().catch(null),
  errorType: ErrorType.catch("none"),
});
export type Grade = z.infer<typeof Grade>;
