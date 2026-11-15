import type { LessonGenerator } from "../lesson/generator";
import type { Catalog } from "../scene/catalog/catalog-types";
import { buildLessonPrompt, buildRepairPrompt } from "./lesson-prompt";
import { LessonParseError, parseLesson } from "./lesson-parse";
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

export interface LessonGeneratorDeps {
  screenModel: TextModel; // on-device first
  writeModel: TextModel; // cloud
  catalog: Catalog;
}

export const createLessonGenerator =
  ({ screenModel, writeModel, catalog }: LessonGeneratorDeps): LessonGenerator =>
  async ({ prompt, language, signal, onProgress }) => {
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

    onProgress({ step: "cloud-write", source: "in_cloud" });
    const options = { catalog, language };
    const first = await writeModel.generateText(
      buildLessonPrompt({ topic: screen.topic, intents: screen.intents, language, catalog }),
      { signal },
    );
    try {
      return parseLesson(first.text, options).lesson;
    } catch (error) {
      if (!(error instanceof LessonParseError)) throw error;
      const repaired = await writeModel.generateText(buildRepairPrompt(first.text, error.problems), { signal });
      return parseLesson(repaired.text, options).lesson;
    }
  };
