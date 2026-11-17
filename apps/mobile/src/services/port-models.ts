import { GRADE_JSON_SCHEMA, GRADE_SYSTEM_INSTRUCTION } from "@scenespeak/core/ai/grade-prompt";
import type { TextModel } from "@scenespeak/core/ai/lesson-generator";
import { MATCH_JSON_SCHEMA, MATCH_SYSTEM_INSTRUCTION } from "@scenespeak/core/ai/lesson-match";
import { LESSON_SYSTEM_INSTRUCTION, lessonJsonSchema } from "@scenespeak/core/ai/lesson-prompt";
import { SCREEN_JSON_SCHEMA, SCREEN_SYSTEM_INSTRUCTION } from "@scenespeak/core/ai/screen-request";
import { CATALOG } from "@scenespeak/core/scene/catalog/catalog";
import type { Catalog } from "@scenespeak/core/scene/catalog/catalog-types";
import type { HybridModel, InferenceMode } from "../ai-port/hybrid-model";
import { type PortModelOptions, createPortTextModel } from "./port-text-model";

// Same instructions, schemas and timeouts as the web's createGradingModel / createGeneratorModel.
export type ModelRole = "grade" | "screen" | "match" | "write";

const SHORT_TIMEOUT_MS = 10_000;
const GRADE_TIMEOUT_MS = 15_000;
// A full scenario plus recipe is a long structured answer.
const WRITE_TIMEOUT_MS = 60_000;

const roleOptions = (role: ModelRole, catalog: Catalog): PortModelOptions => {
  switch (role) {
    case "grade":
      return { systemInstruction: GRADE_SYSTEM_INSTRUCTION, schemaId: "grade", responseSchema: GRADE_JSON_SCHEMA, timeoutMs: GRADE_TIMEOUT_MS };
    case "screen":
      return { systemInstruction: SCREEN_SYSTEM_INSTRUCTION, schemaId: "screen", responseSchema: SCREEN_JSON_SCHEMA, timeoutMs: SHORT_TIMEOUT_MS };
    case "match":
      return { systemInstruction: MATCH_SYSTEM_INSTRUCTION, schemaId: "match", responseSchema: MATCH_JSON_SCHEMA, timeoutMs: SHORT_TIMEOUT_MS };
    case "write":
      return { systemInstruction: LESSON_SYSTEM_INSTRUCTION, schemaId: "lesson", responseSchema: lessonJsonSchema(catalog), timeoutMs: WRITE_TIMEOUT_MS };
  }
};

/** One port-backed model per role and mode, built on first use. */
export const createPortModels = (port: HybridModel, catalog: Catalog = CATALOG) => {
  const models = new Map<string, TextModel>();
  return (role: ModelRole, mode: InferenceMode): TextModel => {
    const key = `${role}:${mode}`;
    let model = models.get(key);
    if (!model) {
      model = createPortTextModel(port, mode, roleOptions(role, catalog));
      models.set(key, model);
    }
    return model;
  };
};
