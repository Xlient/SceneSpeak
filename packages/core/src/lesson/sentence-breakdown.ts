import { z } from "zod";
import { NotConnectedError } from "../services/not-connected";
import { nullableText, text } from "../schemas/primitives";
import type { InferenceSource } from "./grader";

export const WORD_ROLES = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "article",
  "preposition",
  "conjunction",
  "interjection",
  "number",
  "phrase",
  "other",
] as const;
export const WordRole = z.enum(WORD_ROLES);
export type WordRole = z.infer<typeof WordRole>;

export const BreakdownWord = z.object({
  /** Exactly as it appears in the sentence; may span several words ("buenos días"). */
  text: text(60),
  role: WordRole.catch("other"),
  meaning: text(80),
  /** Grammar detail, e.g. "conditional of querer: polite". */
  note: nullableText(160).catch(null),
});
export type BreakdownWord = z.infer<typeof BreakdownWord>;

// Model output is untrusted: bad words are dropped rather than failing the whole breakdown.
const keepValidWords = z
  .array(z.unknown())
  .transform((items) =>
    items
      .flatMap((item) => {
        const parsed = BreakdownWord.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      })
      .slice(0, 30),
  )
  .refine((words) => words.length > 0, "no usable words");

export const SentenceBreakdown = z.object({
  words: keepValidWords,
  /** How the sentence is built compared with English (word order, gender, formality…). */
  structure: text(300),
});
export type SentenceBreakdown = z.infer<typeof SentenceBreakdown>;

export interface ExplainRequest {
  text: string;
  language: string;
  translation: string;
  signal: AbortSignal;
}

export interface ExplainResult {
  breakdown: SentenceBreakdown;
  source: InferenceSource;
  /** Why it ran where it did, for the Model Monitor. */
  route?: string;
}

/** Breaks a line into words with their grammar role. Meant for the on-device model: small, frequent, free. */
export type SentenceExplainer = (request: ExplainRequest) => Promise<ExplainResult>;

export const unavailableExplainer: SentenceExplainer = () =>
  Promise.reject(new NotConnectedError("Grammar breakdown isn't connected yet."));

export type SentencePart = { kind: "text"; text: string } | { kind: "word"; text: string; word: BreakdownWord; index: number };

const normalize = (value: string) =>
  value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();

/** Splits the sentence into parts, linking each word (or multi-word phrase) to its breakdown entry in order. */
export const linkWords = (sentence: string, words: readonly BreakdownWord[]): SentencePart[] => {
  const tokens = sentence.split(/(\s+)/).filter((t) => t.length > 0);
  const parts: SentencePart[] = [];
  let next = 0;
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i] ?? "";
    if (/^\s+$/.test(token) || normalize(token) === "") {
      parts.push({ kind: "text", text: token });
      i += 1;
      continue;
    }
    let matched = false;
    for (let w = next; w < words.length && !matched; w += 1) {
      const word = words[w];
      if (!word) continue;
      const span = word.text.trim().split(/\s+/).length * 2 - 1;
      const candidate = tokens.slice(i, i + span).join("");
      if (normalize(candidate) === normalize(word.text)) {
        const { lead, core, trail } = splitPunctuation(candidate);
        if (lead) parts.push({ kind: "text", text: lead });
        parts.push({ kind: "word", text: core, word, index: w });
        if (trail) parts.push({ kind: "text", text: trail });
        next = w + 1;
        i += span;
        matched = true;
      }
    }
    if (!matched) {
      parts.push({ kind: "text", text: token });
      i += 1;
    }
  }
  return parts;
};

const splitPunctuation = (value: string) => {
  const match = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/su.exec(value);
  return { lead: match?.[1] ?? "", core: match?.[2] ?? value, trail: match?.[3] ?? "" };
};
