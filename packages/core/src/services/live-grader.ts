import type { InferenceMode } from "firebase/ai";
import type { DeviceModelStatus } from "../ai/device";
import { GRADE_JSON_SCHEMA, GRADE_SYSTEM_INSTRUCTION } from "../ai/grade-prompt";
import { type AppModel, createModel } from "../ai/model";
import { type GradingModel, createModelGrader } from "../ai/model-grader";
import { modelLanguages } from "../language/languages";
import type { Grader } from "../lesson/grader";
import { routeAiCall } from "../routing/route";

export const createGradingModel = (mode: InferenceMode, language?: string): AppModel =>
  createModel(mode, { systemInstruction: GRADE_SYSTEM_INSTRUCTION, jsonSchema: GRADE_JSON_SCHEMA, language });

export interface LiveGraderDeps {
  deviceStatus: () => DeviceModelStatus;
  isOnline?: () => boolean;
  makeModel?: (mode: InferenceMode, language: string) => GradingModel;
}

/**
 * Routes each grade (Y4), then builds one model per mode and language on first use,
 * so a missing Firebase config only fails grading, not app start.
 */
export const createLiveGrader = ({
  deviceStatus,
  isOnline = () => navigator.onLine,
  makeModel = createGradingModel,
}: LiveGraderDeps): Grader => {
  const graders = new Map<string, Grader>();
  return (request) => {
    const language = request.scenario.language;
    const route = routeAiCall({
      task: "grade",
      device: deviceStatus().kind,
      language,
      online: isOnline(),
      inputChars: request.reply.length,
    });
    const key = `${route.mode}:${modelLanguages(language).join(",")}`;
    let grader = graders.get(key);
    try {
      if (!grader) {
        grader = createModelGrader(makeModel(route.mode, language));
        graders.set(key, grader);
      }
    } catch (error) {
      return Promise.reject(error);
    }
    return grader(request).then((result) => ({ ...result, route: route.reason }));
  };
};
