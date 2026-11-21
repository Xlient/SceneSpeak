import type { InferenceMode } from "firebase/ai";
import { COACH_JSON_SCHEMA, COACH_SYSTEM_INSTRUCTION } from "../ai/coach-prompt";
import type { DeviceModelStatus } from "../ai/device";
import { EXPLAIN_JSON_SCHEMA, EXPLAIN_SYSTEM_INSTRUCTION } from "../ai/explain-prompt";
import { createModel } from "../ai/model";
import { modelLanguages } from "../language/languages";
import { createModelCoach } from "../ai/model-coach";
import { type TextModel, createModelExplainer } from "../ai/model-explainer";
import type { SentenceExplainer } from "../lesson/sentence-breakdown";
import type { PracticeCoach } from "../progress/coach";
import { AiAbortedError } from "../ai/with-timeout";
import { routeAiCall } from "../routing/route";
import { NotConnectedError } from "./not-connected";

export interface LiveHelperDeps {
  deviceStatus: () => DeviceModelStatus;
  isOnline?: () => boolean;
  makeModel?: (mode: InferenceMode, language: string) => TextModel;
}

/** One model per routed mode and language, built on first use so a missing Firebase config only fails that call. */
const modelsByMode = <T>(build: (mode: InferenceMode, language: string) => T) => {
  const built = new Map<string, T>();
  return (mode: InferenceMode, language: string): T => {
    const key = `${mode}:${modelLanguages(language).join(",")}`;
    let value = built.get(key);
    if (value === undefined) {
      value = build(mode, language);
      built.set(key, value);
    }
    return value;
  };
};

const defaultOnline = () => navigator.onLine;

/** Grammar breakdown: device first, cloud when Nano can't take it (same routing as grading). */
export const createLiveExplainer = ({
  deviceStatus,
  isOnline = defaultOnline,
  makeModel = (mode, language) => createModel(mode, { systemInstruction: EXPLAIN_SYSTEM_INSTRUCTION, jsonSchema: EXPLAIN_JSON_SCHEMA, language }),
}: LiveHelperDeps): SentenceExplainer => {
  const explainerFor = modelsByMode((mode, language) => createModelExplainer(makeModel(mode, language)));
  return async (request) => {
    const route = routeAiCall({
      task: "explain",
      device: deviceStatus().kind,
      language: request.language,
      online: isOnline(),
      inputChars: request.text.length,
    });
    const result = await explainerFor(route.mode, request.language)(request);
    return { ...result, route: route.reason };
  };
};

export class CoachNeedsDeviceError extends NotConnectedError {
  override readonly name = "CoachNeedsDeviceError";

  constructor() {
    super("The coach only runs on your device, to keep your practice private. It needs Chrome's on-device AI: open the account menu and choose Set up.");
  }
}

/** Weekly recap: on the device or not at all. Practice stats are never sent to the cloud. */
export const createLiveCoach = ({
  deviceStatus,
  makeModel = (mode) => createModel(mode, { systemInstruction: COACH_SYSTEM_INSTRUCTION, jsonSchema: COACH_JSON_SCHEMA, languages: ["en"] }),
}: Omit<LiveHelperDeps, "isOnline">): PracticeCoach => {
  // The coach writes English only, so one model per mode is enough.
  const coachFor = modelsByMode((mode) => createModelCoach(makeModel(mode, "en")));
  return async (request) => {
    const device = deviceStatus().kind;
    if (device === "not-supported" || device === "unavailable") throw new CoachNeedsDeviceError();
    const route = routeAiCall({ task: "coach", device, language: request.language, online: true });
    try {
      const result = await coachFor(route.mode, "en")(request);
      return { ...result, route: route.reason };
    } catch (error) {
      // "idle" can mean Chrome has the Prompt API but Nano was never downloaded; point the learner at Set up.
      if (device === "idle" && !(error instanceof AiAbortedError)) throw new CoachNeedsDeviceError();
      throw error;
    }
  };
};
