import { z } from "zod";
import { Id, LanguageCode, cappedArray, nullableText, optionalCappedArray, text } from "./primitives";

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const Level = z.enum(LEVELS);
export type Level = z.infer<typeof Level>;

export const ANIMATIONS = ["idle", "talk", "wave", "nod", "point", "think"] as const;
export const Animation = z.enum(ANIMATIONS);
export type Animation = z.infer<typeof Animation>;

export const LEARNER_SPEAKER = "learner";

export const CastMember = z.object({
  characterId: Id,
  role: text(40),
  name: text(40),
});
export type CastMember = z.infer<typeof CastMember>;

export const Goal = z.object({
  id: Id,
  description: text(160),
});
export type Goal = z.infer<typeof Goal>;

export const VocabItem = z.object({
  word: text(60),
  meaning: text(120),
});
export type VocabItem = z.infer<typeof VocabItem>;

export const Line = z.object({
  id: Id,
  speaker: Id,
  text: text(300),
  translation: text(300),
  animation: Animation.catch("idle"),
  expects: nullableText(64),
});
export type Line = z.infer<typeof Line>;

export const Scenario = z
  .object({
    id: Id,
    language: LanguageCode,
    level: Level.catch("A1"),
    title: text(80),
    setting: text(200),
    cast: cappedArray(CastMember, 3),
    goals: cappedArray(Goal, 4),
    vocab: optionalCappedArray(VocabItem, 12),
    lines: cappedArray(Line, 20),
  })
  .transform((s) => {
    const goalIds = new Set(s.goals.map((g) => g.id));
    return {
      ...s,
      lines: s.lines.map((line) =>
        line.expects !== null && !goalIds.has(line.expects) ? { ...line, expects: null } : line,
      ),
    };
  });
export type Scenario = z.infer<typeof Scenario>;
