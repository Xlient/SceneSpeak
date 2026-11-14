import type { InferenceMode } from "firebase/ai";
import type { DeviceModelStatus } from "../ai/device";
import { GRADE_JSON_SCHEMA, GRADE_SYSTEM_INSTRUCTION } from "../ai/grade-prompt";
import { type AppModel, createModel } from "../ai/model";
import { type GradingModel, createModelGrader } from "../ai/model-grader";
import type { Grader } from "../lesson/grader";
import { routeAiCall } from "../routing/route";

export const createGradingModel = (mode: InferenceMode): AppModel =>
  createModel(mode, { systemInstruction: GRADE_SYSTEM_INSTRUCTION, jsonSchema: GRADE_JSON_SCHEMA });

export interface LiveGraderDeps {
  deviceStatus: () => DeviceModelStatus;
  isOnline?: () => boolean;
  makeModel?: (mode: InferenceMode) => GradingModel;
}

/**
 * Routes each grade (Y4), then builds one model per mode on first use,
 * so a missing Firebase config only fails grading, not app start.
 */
export const createLiveGrader = ({
  deviceStatus,
  isOnline = () => navigator.onLine,
  makeModel = createGradingModel,
}: LiveGraderDeps): Grader => {
  const graders = new Map<InferenceMode, Grader>();
  return (request) => {
    const route = routeAiCall({
      task: "grade",
      device: deviceStatus().kind,
      language: request.scenario.language,
      online: isOnline(),
      inputChars: request.reply.length,
    });
    let grader = graders.get(route.mode);
    try {
      if (!grader) {
        grader = createModelGrader(makeModel(route.mode));
        graders.set(route.mode, grader);
      }
    } catch (error) {
      return Promise.reject(error);
    }
    return grader(request).then((result) => ({ ...result, route: route.reason }));
  };
};
