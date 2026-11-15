import { z } from "zod";
import type { Catalog } from "../scene/catalog/catalog-types";
import { sceneRecipeJsonSchema } from "../scene/recipe/scene-recipe";
import { type Intent, LEARNER_SPEAKER, Scenario } from "../schemas";

export const LESSON_SYSTEM_INSTRUCTION = [
  "You write 5-minute role-play lessons for beginner (A1) language learners in a family-friendly 3D app.",
  "Write 6 to 12 short, natural lines in the target language, each with an English translation.",
  `Alternate between cast characters and the learner. Learner lines use speaker "${LEARNER_SPEAKER}" and set expects to a goal id; other lines set expects to null.`,
  "Each learner line's text is an example answer the learner could give.",
  "Build the scene recipe only from the room, character and prop IDs listed in the prompt.",
  "Every cast characterId must be one of the listed character IDs.",
  "Reply with JSON only.",
].join("\n");

export const lessonJsonSchema = (catalog: Catalog) => ({
  type: "object",
  properties: {
    // io "input" describes what the model sends before our transforms run; transforms can't be expressed otherwise.
    scenario: z.toJSONSchema(Scenario, { io: "input", unrepresentable: "any" }),
    recipe: sceneRecipeJsonSchema(catalog),
  },
  required: ["scenario", "recipe"],
});

export interface LessonPromptInput {
  topic: string;
  intents: readonly Intent[];
  language: string;
  catalog: Catalog;
}

const languageName = (code: string): string =>
  new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;

const listIds = (items: readonly { id: string; label: string }[]): string =>
  items.map((item) => `- ${item.id}: ${item.label}`).join("\n");

export const buildLessonPrompt = ({ topic, intents, language, catalog }: LessonPromptInput): string =>
  [
    `Topic: ${topic}`,
    `Target language: ${languageName(language)}`,
    ...(intents.length > 0 ? [`Skills to practise: ${intents.join(", ")}`] : []),
    `Learner speaker id: "${LEARNER_SPEAKER}"`,
    "",
    `Rooms:\n${listIds(catalog.rooms)}`,
    "",
    `Characters:\n${listIds(catalog.characters)}`,
    "",
    `Props:\n${listIds(catalog.props)}`,
  ].join("\n");

export const buildRepairPrompt = (previous: string, problems: readonly string[]): string =>
  [
    "Your previous answer had these problems:",
    ...problems.map((problem) => `- ${problem}`),
    "",
    "Previous answer:",
    previous,
    "",
    "Reply with the whole corrected JSON.",
  ].join("\n");
