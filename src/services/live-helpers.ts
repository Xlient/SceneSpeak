import type { InferenceMode } from "firebase/ai";
import { COACH_JSON_SCHEMA, COACH_SYSTEM_INSTRUCTION } from "../ai/coach-prompt";
import type { DeviceModelStatus } from "../ai/device";
import { EXPLAIN_JSON_SCHEMA, EXPLAIN_SYSTEM_INSTRUCTION } from "../ai/explain-prompt";
import { createModel } from "../ai/model";
import { createModelCoach } from "../ai/model-coach";
import { type TextModel, createModelExplainer } from "../ai/model-explainer";
import type { SentenceExplainer } from "../lesson/sentence-breakdown";
import type { PracticeCoach } from "../progress/coach";
import { routeAiCall } from "../routing/route";
import { NotConnectedError } from "./not-connected";

export interface LiveHelperDeps {
  deviceStatus: () => DeviceModelStatus;
  isOnline?: () => boolean;
  makeModel?: (mode: InferenceMode) => TextModel;
}

/** One model per routed mode, built on first use so a missing Firebase config only fails that call. */
const modelsByMode = <T>(build: (mode: InferenceMode) => T) => {
  const built = new Map<InferenceMode, T>();
  return (mode: InferenceMode): T => {
    let value = built.get(mode);
    if (value === undefined) {
      value = build(mode);
      built.set(mode, value);
    }
    return value;
  };
};

const defaultOnline = () => navigator.onLine;

/** Grammar breakdown: device first, cloud when Nano can't take it (same routing as grading). */
export const createLiveExplainer = ({
  deviceStatus,
  isOnline = defaultOnline,
  makeModel = (mode) => createModel(mode, { systemInstruction: EXPLAIN_SYSTEM_INSTRUCTION, jsonSchema: EXPLAIN_JSON_SCHEMA }),
}: LiveHelperDeps): SentenceExplainer => {
  const explainerFor = modelsByMode((mode) => createModelExplainer(makeModel(mode)));
  return async (request) => {
    const route = routeAiCall({
      task: "explain",
      device: deviceStatus().kind,
      language: request.language,
      online: isOnline(),
      inputChars: request.text.length,
    });
    const result = await explainerFor(route.mode)(request);
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
  const coachFor = modelsByMode((mode) => createModelCoach(makeModel(mode)));
  return async (request) => {
    const device = deviceStatus().kind;
    if (device === "not-supported" || device === "unavailable") throw new CoachNeedsDeviceError();
    const route = routeAiCall({ task: "coach", device, language: request.language, online: true });
    const result = await coachFor(route.mode)(request);
    return { ...result, route: route.reason };
  };
};
