import { z } from "zod";
import { Intent, isIntent } from "./intent";
import { LanguageCode, optionalCappedArray, text } from "./primitives";

export const SCRIPTS = ["latin", "hanzi", "arabic"] as const;
export const Script = z.enum(SCRIPTS);
export type Script = z.infer<typeof Script>;

export const DIRECTIONS = ["ltr", "rtl"] as const;
export const Direction = z.enum(DIRECTIONS);
export type Direction = z.infer<typeof Direction>;

export const PhraseEntry = z.object({
  phrase: text(160),
  alternatives: optionalCappedArray(text(160), 8),
  translation: text(160),
  cultureNote: text(240).optional(),
});
export type PhraseEntry = z.infer<typeof PhraseEntry>;

const keepKnownIntents = (value: unknown): unknown => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return value;
  const known: Partial<Record<Intent, unknown>> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (isIntent(key)) known[key] = entry;
  }
  return known;
};

export const LanguagePack = z.object({
  language: LanguageCode,
  script: Script,
  direction: Direction,
  acceptsRomanization: z.boolean(),
  lenientDiacritics: z.boolean(),
  phrases: z.preprocess(keepKnownIntents, z.partialRecord(Intent, PhraseEntry)),
});
export type LanguagePack = z.infer<typeof LanguagePack>;
