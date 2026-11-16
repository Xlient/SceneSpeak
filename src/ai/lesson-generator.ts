import type { GeneratedLesson, LessonGenerator, LibraryMatch } from "../lesson/generator";
import type { Intent } from "../schemas";
import type { Catalog } from "../scene/catalog/catalog-types";
import { buildLessonPrompt, buildRepairPrompt } from "./lesson-prompt";
import { LessonParseError, type ParsedLesson, parseLesson } from "./lesson-parse";
import type { AppModel } from "./model";
import { redactPii } from "./redact";
import { type PromptScreen, buildScreenPrompt, parseScreen } from "./screen-request";
import { AiAbortedError } from "./with-timeout";

export type TextModel = Pick<AppModel, "generateText">;

export class UnsafeRequestError extends Error {
  override readonly name = "UnsafeRequestError";

  constructor(reason: string | null) {
    super(reason ?? "That request isn't something SceneSpeak can make a lesson about.");
  }
}

export interface ExistingQuery {
  /** The learner's redacted words; matching leans on these over the device summary. */
  request: string;
  topic: string;
  intents: readonly Intent[];
  language: string;
  signal: AbortSignal;
}

export interface LessonGeneratorDeps {
  screenModel: TextModel; // on-device first
  writeModel: TextModel; // cloud
  catalog: Catalog;
  /** Looks for a published lesson that already covers the request. */
  findExisting?: (query: ExistingQuery) => Promise<LibraryMatch | null>;
}

export const createLessonGenerator =
  ({ screenModel, writeModel, catalog, findExisting }: LessonGeneratorDeps): LessonGenerator =>
  async ({ prompt, language, signal, onProgress, allowExisting = true }) => {
    onProgress({ step: "device-check" });
    const request = redactPii(prompt).text;

    let screen: PromptScreen;
    try {
      const result = await screenModel.generateText(buildScreenPrompt(request), { signal });
      screen = parseScreen(result.text);
    } catch (error) {
      if (error instanceof AiAbortedError) throw error;
      // A flaky device check shouldn't block the lesson; the cloud has its own safety filters.
      screen = { safe: true, reason: null, topic: request, intents: [] };
    }
    if (!screen.safe) throw new UnsafeRequestError(screen.reason);

    if (findExisting && allowExisting) {
      onProgress({ step: "library-check" });
      try {
        const match = await findExisting({ request, topic: screen.topic, intents: screen.intents, language, signal });
        // Reusing a lesson saves a cloud write.
        if (match) return { kind: "existing", match };
      } catch (error) {
        if (error instanceof AiAbortedError) throw error;
      }
    }

    onProgress({ step: "cloud-write", source: "in_cloud" });
    const generated = (lesson: GeneratedLesson) => ({ kind: "generated" as const, lesson, topic: screen.topic, intents: screen.intents });
    const options = { catalog, language };
    const first = await writeModel.generateText(
      buildLessonPrompt({ request, topic: screen.topic, intents: screen.intents, language, catalog }),
      { signal },
    );
    let parsed: ParsedLesson;
    try {
      parsed = parseLesson(first.text, options);
    } catch (error) {
      if (!(error instanceof LessonParseError)) throw error;
      const repaired = await writeModel.generateText(buildRepairPrompt(first.text, error.problems), { signal });
      return generated(parseLesson(repaired.text, options).lesson);
    }
    if (parsed.shortfalls.length === 0) return generated(parsed.lesson);

    // Too short: one try at a fuller version, but the first lesson already works, so keep it if the retry doesn't.
    try {
      const fuller = await writeModel.generateText(buildRepairPrompt(first.text, parsed.shortfalls), { signal });
      const retry = parseLesson(fuller.text, options);
      return generated(retry.shortfalls.length <= parsed.shortfalls.length ? retry.lesson : parsed.lesson);
    } catch (error) {
      if (error instanceof AiAbortedError) throw error;
      return generated(parsed.lesson);
    }
  };
