import { CoachNote, type PracticeCoach } from "../progress/coach";
import { buildCoachPrompt } from "./coach-prompt";
import type { TextModel } from "./model-explainer";
import { parseModelJson, withOneRetry } from "./model-json";

export const createModelCoach =
  (model: TextModel): PracticeCoach =>
  (request) => {
    const prompt = buildCoachPrompt(request);
    return withOneRetry(async () => {
      const result = await model.generateText(prompt, { signal: request.signal });
      return { note: parseModelJson(result.text, CoachNote), source: result.source ?? "on_device" };
    });
  };
