import { z } from "zod";
import type { GeneratedLesson } from "../lesson/generator";
import type { Catalog } from "../scene/catalog/catalog-types";
import { type RecipeIssue, resolveRecipe } from "../scene/recipe/resolve-recipe";
import { SceneRecipe } from "../scene/recipe/scene-recipe";
import { LEARNER_SPEAKER, Scenario } from "../schemas";

export class LessonParseError extends Error {
  override readonly name = "LessonParseError";

  constructor(
    readonly problems: readonly string[],
    readonly raw: string,
  ) {
    super(`Lesson problems:\n${problems.join("\n")}`);
  }
}

export const parseModelJson = (raw: string): unknown => {
  const unfenced = raw.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
  try {
    return JSON.parse(unfenced);
  } catch (error) {
    const why = error instanceof Error ? error.message : String(error);
    throw new LessonParseError([`Not valid JSON: ${why}`], raw);
  }
};

export interface ParseLessonOptions {
  catalog: Catalog;
  language: string;
}

export interface ParsedLesson {
  lesson: GeneratedLesson;
  issues: readonly RecipeIssue[];
  /** Playable but thinner than asked for; worth one repair, never worth failing over. */
  shortfalls: readonly string[];
}

export const MIN_LESSON_LINES = 6;
export const MIN_LEARNER_TURNS = 2;

export const lessonShortfalls = (lines: readonly { speaker: string; expects: string | null }[]): string[] => {
  const learnerTurns = lines.filter((line) => line.speaker === LEARNER_SPEAKER && line.expects !== null).length;
  return [
    ...(lines.length < MIN_LESSON_LINES ? [`scenario.lines: only ${lines.length} lines; write at least ${MIN_LESSON_LINES}`] : []),
    ...(learnerTurns < MIN_LEARNER_TURNS
      ? [`scenario.lines: only ${learnerTurns} learner turn(s) with a goal; write at least ${MIN_LEARNER_TURNS}`]
      : []),
  ];
};

const LessonShape = z.object({ scenario: z.unknown(), recipe: z.unknown() });

export const parseLesson = (raw: string, { catalog, language }: ParseLessonOptions): ParsedLesson => {
  const shape = LessonShape.safeParse(parseModelJson(raw));
  if (!shape.success) throw new LessonParseError([z.prettifyError(shape.error)], raw);

  const parsed = Scenario.safeParse(shape.data.scenario);
  if (!parsed.success) throw new LessonParseError([`scenario: ${z.prettifyError(parsed.error)}`], raw);
  // The learner picked the language; the model doesn't get a vote.
  const scenario = { ...parsed.data, language };

  const problems: string[] = [];
  if (!scenario.lines.some((line) => line.speaker === LEARNER_SPEAKER && line.expects !== null)) {
    problems.push(`scenario.lines: no "${LEARNER_SPEAKER}" turns with an expects goal id`);
  }
  const speakers = new Set([LEARNER_SPEAKER, ...scenario.cast.map((member) => member.characterId)]);
  for (const line of scenario.lines) {
    if (!speakers.has(line.speaker)) problems.push(`line ${line.id}: speaker "${line.speaker}" isn't in the cast`);
  }
  const recipe = SceneRecipe.safeParse(shape.data.recipe);
  if (!recipe.success) problems.push(`recipe: ${z.prettifyError(recipe.error)}`);

  if (!recipe.success || problems.length > 0) throw new LessonParseError(problems, raw);

  // Unknown catalog IDs get swapped for defaults by the resolver, so they lower quality but don't block.
  return {
    lesson: { scenario, recipe: recipe.data },
    issues: resolveRecipe(recipe.data, catalog, scenario).issues,
    shortfalls: lessonShortfalls(scenario.lines),
  };
};
