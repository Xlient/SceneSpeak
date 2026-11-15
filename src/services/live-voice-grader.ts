import type { InferenceMode } from "firebase/ai";
import { type AppModel, createModel } from "../ai/model";
import { type VoiceGradingModel, createModelVoiceGrader } from "../ai/model-voice-grader";
import { VOICE_GRADE_JSON_SCHEMA, VOICE_GRADE_SYSTEM_INSTRUCTION } from "../ai/voice-grade-prompt";
import { type AudioEncoder, encodeVoiceReply } from "../audio/wav";
import type { VoiceGrader } from "../lesson/voice-grader";
import { routeAiCall } from "../routing/route";

export class VoiceOfflineError extends Error {
  override readonly name = "VoiceOfflineError";

  constructor() {
    super("Voice replies need an internet connection. You can still type your reply.");
  }
}

export const createVoiceGradingModel = (mode: InferenceMode): AppModel =>
  createModel(mode, { systemInstruction: VOICE_GRADE_SYSTEM_INSTRUCTION, jsonSchema: VOICE_GRADE_JSON_SCHEMA });

export interface LiveVoiceGraderDeps {
  isOnline?: () => boolean;
  makeModel?: (mode: InferenceMode) => VoiceGradingModel;
  encode?: AudioEncoder;
}

/** Voice always routes to the cloud (the on-device model can't take audio). The model is built on first use. */
export const createLiveVoiceGrader = ({
  isOnline = () => navigator.onLine,
  makeModel = createVoiceGradingModel,
  encode = encodeVoiceReply,
}: LiveVoiceGraderDeps = {}): VoiceGrader => {
  let grader: VoiceGrader | undefined;
  return (request) => {
    if (!isOnline()) return Promise.reject(new VoiceOfflineError());
    // Device state doesn't matter here: the capability rule decides before it's read.
    const route = routeAiCall({ task: "grade-voice", device: "not-supported", language: request.scenario.language, online: true });
    try {
      grader ??= createModelVoiceGrader(makeModel(route.mode), encode);
    } catch (error) {
      return Promise.reject(error);
    }
    return grader(request).then((result) => ({ ...result, route: route.reason }));
  };
};
