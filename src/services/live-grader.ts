import { InferenceMode } from "firebase/ai";
import { GRADE_JSON_SCHEMA, GRADE_SYSTEM_INSTRUCTION } from "../ai/grade-prompt";
import { type AppModel, createModel } from "../ai/model";
import { type GradingModel, createModelGrader } from "../ai/model-grader";
import type { Grader } from "../lesson/grader";

// Y4 (routing) will replace this fixed mode.
export const createGradingModel = (): AppModel =>
  createModel(InferenceMode.PREFER_ON_DEVICE, {
    systemInstruction: GRADE_SYSTEM_INSTRUCTION,
    jsonSchema: GRADE_JSON_SCHEMA,
  });

/** Builds the model on the first grade, so a missing Firebase config only fails grading, not app start. */
export const createLiveGrader = (makeModel: () => GradingModel = createGradingModel): Grader => {
  let grader: Grader | undefined;
  return (request) => {
    try {
      grader ??= createModelGrader(makeModel());
    } catch (error) {
      return Promise.reject(error);
    }
    return grader(request);
  };
};
