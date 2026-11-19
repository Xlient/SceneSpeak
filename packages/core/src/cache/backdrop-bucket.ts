import { z } from "zod";

// Cloud Storage bucket naming rules, minus the dotted (domain) form we don't use.
const BucketName = z
  .string()
  .trim()
  .regex(/^[a-z0-9][a-z0-9_-]{1,61}[a-z0-9]$/);

/** The shared backdrop bucket from env, or undefined to keep the cache device-only. */
export const readBackdropBucket = (value: unknown): string | undefined => {
  const parsed = BucketName.safeParse(value);
  return parsed.success ? parsed.data : undefined;
};
