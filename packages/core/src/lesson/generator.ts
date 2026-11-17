import type { SceneRecipe } from "../scene/recipe/scene-recipe";
import type { Intent, Scenario } from "../schemas";
import { NotConnectedError } from "../services/not-connected";
import type { InferenceSource } from "./grader";

export const GENERATION_STEPS = ["device-check", "library-check", "cloud-write"] as const;
export type GenerationStep = (typeof GENERATION_STEPS)[number];

export interface GenerationProgress {
  step: GenerationStep;
  source?: InferenceSource;
}

export interface LessonRequest {
  prompt: string;
  language: "es";
  signal: AbortSignal;
  /** Call when each step starts so the UI can show where the work is running. */
  onProgress: (progress: GenerationProgress) => void;
  /** False skips the library check, for "make mine anyway". */
  allowExisting?: boolean;
}

export interface GeneratedLesson {
  scenario: Scenario;
  recipe: SceneRecipe;
}

/** A published library lesson that already covers the request. */
export interface LibraryMatch {
  id: string;
  title: string;
  votes: number;
}

export type GenerationResult =
  | { kind: "generated"; lesson: GeneratedLesson; topic: string; intents: readonly Intent[] }
  | { kind: "existing"; match: LibraryMatch };

/** Y5 plugs in here: request → device safety/PII check → cloud Scenario + scene recipe. */
export type LessonGenerator = (request: LessonRequest) => Promise<GenerationResult>;

export class GeneratorUnavailableError extends NotConnectedError {
  override readonly name = "GeneratorUnavailableError";

  constructor() {
    super("The lesson generator isn't connected yet. Try a featured lesson for now.");
  }
}

export const unavailableGenerator: LessonGenerator = () => Promise.reject(new GeneratorUnavailableError());

export const LESSON_PROMPT_MIN = 4;
export const LESSON_PROMPT_MAX = 200;

export type PromptCheck = { ok: true; prompt: string } | { ok: false; message: string };

export const checkLessonPrompt = (raw: string): PromptCheck => {
  const prompt = raw.replace(/\s+/g, " ").trim();
  if (prompt.length < LESSON_PROMPT_MIN) return { ok: false, message: "Tell us a bit more about the conversation you want." };
  if (prompt.length > LESSON_PROMPT_MAX) return { ok: false, message: `Keep it under ${LESSON_PROMPT_MAX} characters.` };
  return { ok: true, prompt };
};
