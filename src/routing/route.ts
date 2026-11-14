import { InferenceMode } from "firebase/ai";
import type { DeviceModelStatus } from "../ai/device";
import type { AiTask } from "../monitor/model-monitor";

/** Languages Chrome's Prompt API accepts for text in and out. */
export const ON_DEVICE_LANGUAGES: readonly string[] = ["en", "es", "ja"];

/** Longer replies grade better on the bigger cloud model and risk Nano's context window. */
export const MAX_ON_DEVICE_CHARS = 500;

export interface RouteInput {
  task: AiTask;
  device: DeviceModelStatus["kind"];
  language: string;
  online: boolean;
  inputChars?: number;
}

export type RouteRule = "capability" | "language" | "offline" | "long-input" | "device-busy" | "device-missing" | "on-device";

export interface RouteDecision {
  mode: InferenceMode;
  rule: RouteRule;
  reason: string;
}

const CLOUD_ONLY_TASKS: Partial<Record<AiTask, string>> = {
  "grade-voice": "audio input needs the cloud model",
  speak: "speech output needs the cloud model",
  paint: "image output needs the cloud model",
  generate: "long structured lessons need the larger cloud model",
};

const baseLanguage = (language: string) => language.split("-")[0]?.toLowerCase() ?? language;

/** First matching rule wins; order is capability → language → connectivity → size → device state. */
export const routeAiCall = (input: RouteInput): RouteDecision => {
  const cloudOnly = CLOUD_ONLY_TASKS[input.task];
  if (cloudOnly) return { mode: InferenceMode.ONLY_IN_CLOUD, rule: "capability", reason: `Cloud: ${cloudOnly}` };

  if (!ON_DEVICE_LANGUAGES.includes(baseLanguage(input.language))) {
    return { mode: InferenceMode.ONLY_IN_CLOUD, rule: "language", reason: `Cloud: on-device AI doesn't support "${input.language}"` };
  }

  if (!input.online) {
    return input.device === "ready"
      ? { mode: InferenceMode.ONLY_ON_DEVICE, rule: "offline", reason: "Device: offline, so on-device only" }
      : { mode: InferenceMode.ONLY_IN_CLOUD, rule: "offline", reason: "Cloud: offline and on-device AI isn't ready" };
  }

  if ((input.inputChars ?? 0) > MAX_ON_DEVICE_CHARS) {
    return { mode: InferenceMode.PREFER_IN_CLOUD, rule: "long-input", reason: `Cloud: input over ${MAX_ON_DEVICE_CHARS} characters` };
  }

  switch (input.device) {
    case "checking":
    case "downloading":
      return { mode: InferenceMode.ONLY_IN_CLOUD, rule: "device-busy", reason: "Cloud: on-device AI is still setting up" };
    case "unavailable":
    case "not-supported":
      return { mode: InferenceMode.ONLY_IN_CLOUD, rule: "device-missing", reason: "Cloud: on-device AI isn't available here" };
    case "idle":
    case "ready":
      // "idle" may still have Nano downloaded from a past visit; the SDK checks and falls back on its own.
      return { mode: InferenceMode.PREFER_ON_DEVICE, rule: "on-device", reason: "Device first: private, free and fast" };
  }
};
