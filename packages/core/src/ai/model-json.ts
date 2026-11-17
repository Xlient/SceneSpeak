import { z } from "zod";

export class ModelOutputError extends Error {
  override readonly name = "ModelOutputError";

  constructor(
    message: string,
    readonly raw: string,
  ) {
    super(message);
  }
}

/** Parses a model's JSON reply (with or without ``` fences) against a schema. */
export const parseModelJson = <T extends z.ZodType>(raw: string, schema: T): z.output<T> => {
  const stripped = raw.replace(/^\s*```(?:json)?\s*/, "").replace(/\s*```\s*$/, "");
  let json: unknown;
  try {
    json = JSON.parse(stripped);
  } catch (error) {
    throw new ModelOutputError(`Not JSON: ${error instanceof Error ? error.message : String(error)}`, raw);
  }
  const result = schema.safeParse(json);
  if (!result.success) throw new ModelOutputError(`Wrong shape:\n${z.prettifyError(result.error)}`, raw);
  return result.data;
};

/** Runs an attempt, retrying once if the model's output didn't parse (often a one-off on small models). */
export const withOneRetry = async <T>(attempt: () => Promise<T>): Promise<T> => {
  try {
    return await attempt();
  } catch (error) {
    if (error instanceof ModelOutputError) return attempt();
    throw error;
  }
};
