import type { InferenceMode } from "firebase/ai";
import type { DeviceModelStatus } from "../ai/device";
import { type TextModel, createLessonGenerator } from "../ai/lesson-generator";
import { MATCH_JSON_SCHEMA, MATCH_SYSTEM_INSTRUCTION, createLessonMatcher } from "../ai/lesson-match";
import { LESSON_SYSTEM_INSTRUCTION, lessonJsonSchema } from "../ai/lesson-prompt";
import { createModel } from "../ai/model";
import { SCREEN_JSON_SCHEMA, SCREEN_SYSTEM_INSTRUCTION } from "../ai/screen-request";
import type { LessonGenerator } from "../lesson/generator";
import type { LibraryStore } from "../library/library";
import { routeAiCall } from "../routing/route";
import { CATALOG } from "../scene/catalog/catalog";
import type { Catalog } from "../scene/catalog/catalog-types";
import { createLibraryFinder } from "./library-finder";

const SCREEN_TIMEOUT_MS = 10_000;
// A full scenario plus recipe is a long structured answer.
const WRITE_TIMEOUT_MS = 60_000;

export type ModelRole = "screen" | "match" | "write";

export const createGeneratorModel = (role: ModelRole, mode: InferenceMode, catalog: Catalog = CATALOG): TextModel => {
  switch (role) {
    case "screen":
      return createModel(mode, { systemInstruction: SCREEN_SYSTEM_INSTRUCTION, jsonSchema: SCREEN_JSON_SCHEMA, timeoutMs: SCREEN_TIMEOUT_MS });
    case "match":
      return createModel(mode, { systemInstruction: MATCH_SYSTEM_INSTRUCTION, jsonSchema: MATCH_JSON_SCHEMA, timeoutMs: SCREEN_TIMEOUT_MS });
    case "write":
      return createModel(mode, { systemInstruction: LESSON_SYSTEM_INSTRUCTION, jsonSchema: lessonJsonSchema(catalog), timeoutMs: WRITE_TIMEOUT_MS });
  }
};

export interface LiveGeneratorDeps {
  deviceStatus: () => DeviceModelStatus;
  isOnline?: () => boolean;
  catalog?: Catalog;
  makeModel?: (role: ModelRole, mode: InferenceMode) => TextModel;
  /** When set, requests already covered by a published lesson suggest that lesson instead. */
  library?: LibraryStore;
}

/** Routes the screen step like any short text task; the write step always routes to the cloud. Models are built on first use. */
export const createLiveGenerator = ({
  deviceStatus,
  isOnline = () => navigator.onLine,
  catalog = CATALOG,
  makeModel = (role, mode) => createGeneratorModel(role, mode, catalog),
  library,
}: LiveGeneratorDeps): LessonGenerator => {
  const models = new Map<string, TextModel>();
  const model = (role: ModelRole, mode: InferenceMode): TextModel => {
    const key = `${role}:${mode}`;
    let found = models.get(key);
    if (!found) {
      found = makeModel(role, mode);
      models.set(key, found);
    }
    return found;
  };

  return async (request) => {
    const common = { device: deviceStatus().kind, language: request.language, online: isOnline() };
    const screenRoute = routeAiCall({ ...common, task: "screen", inputChars: request.prompt.length });
    const writeRoute = routeAiCall({ ...common, task: "generate" });
    const matchRoute = routeAiCall({ ...common, task: "match" });
    const generate = createLessonGenerator({
      screenModel: model("screen", screenRoute.mode),
      writeModel: model("write", writeRoute.mode),
      catalog,
      ...(library
        ? { findExisting: createLibraryFinder({ library, match: createLessonMatcher(model("match", matchRoute.mode)) }) }
        : {}),
    });
    return generate(request);
  };
};

