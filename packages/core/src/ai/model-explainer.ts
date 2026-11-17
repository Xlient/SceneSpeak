import { SentenceBreakdown, type SentenceExplainer } from "../lesson/sentence-breakdown";
import { buildExplainPrompt } from "./explain-prompt";
import type { AppModel } from "./model";
import { parseModelJson, withOneRetry } from "./model-json";

export type TextModel = Pick<AppModel, "generateText">;

export const createModelExplainer =
  (model: TextModel): SentenceExplainer =>
  (request) => {
    const prompt = buildExplainPrompt(request);
    return withOneRetry(async () => {
      const result = await model.generateText(prompt, { signal: request.signal });
      return { breakdown: parseModelJson(result.text, SentenceBreakdown), source: result.source ?? "on_device" };
    });
  };
