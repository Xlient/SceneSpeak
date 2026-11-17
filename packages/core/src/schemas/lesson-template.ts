import { z } from "zod";
import { Intent } from "./intent";
import { Id, cappedArray, text } from "./primitives";
import { Level } from "./scenario";

export const FORMALITIES = ["formal", "casual"] as const;
export const Formality = z.enum(FORMALITIES);
export type Formality = z.infer<typeof Formality>;

export const TemplateCastMember = z.object({
  characterId: Id,
  role: text(40),
  formality: Formality.catch("formal"),
});
export type TemplateCastMember = z.infer<typeof TemplateCastMember>;

export const TemplateGoal = z.object({
  id: Id,
  intent: z.unknown(),
});

export const LessonTemplate = z.object({
  id: Id,
  scene: Id,
  level: Level.catch("A1"),
  title: text(80),
  cast: cappedArray(TemplateCastMember, 3),
  goals: z
    .array(TemplateGoal)
    .transform((goals) =>
      goals.flatMap((g) => {
        const intent = Intent.safeParse(g.intent);
        return intent.success ? [{ id: g.id, intent: intent.data }] : [];
      }),
    )
    .pipe(z.array(z.object({ id: Id, intent: Intent })).min(1))
    .transform((goals) => goals.slice(0, 4)),
});
export type LessonTemplate = z.infer<typeof LessonTemplate>;
