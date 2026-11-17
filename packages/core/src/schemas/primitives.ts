import { z } from "zod";

export const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .transform((s) => s.slice(0, max));

export const nullableText = (max: number) =>
  z.preprocess(
    (v) => (v === undefined || (typeof v === "string" && v.trim() === "") ? null : v),
    z
      .string()
      .trim()
      .transform((s) => s.slice(0, max))
      .nullable(),
  );

export const clampedInt = (min: number, max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v),
    z.number().transform((n) => Math.round(Math.min(max, Math.max(min, n)))),
  );

export const cappedArray = <T extends z.ZodType>(item: T, max: number) =>
  z
    .array(item)
    .min(1)
    .transform((items) => items.slice(0, max));

export const optionalCappedArray = <T extends z.ZodType>(item: T, max: number) =>
  z
    .array(item)
    .default([])
    .transform((items) => items.slice(0, max));

export const LanguageCode = z
  .string()
  .trim()
  .regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/, "expected a BCP 47 language code like es or zh-Hans");

export const Id = z
  .string()
  .trim()
  .regex(/^[a-z0-9][a-z0-9_-]{0,63}$/, "expected a lowercase id");
