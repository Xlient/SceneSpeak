import { InferenceMode } from "firebase/ai";
import { DEFAULT_LESSON_LANGUAGE } from "../language/languages";
import { type ModelPort, buildHybridParams, firebaseFactory } from "./model";
import { AiAbortedError, withTimeout } from "./with-timeout";

export type DeviceModelStatus =
  | { kind: "idle" }
  | { kind: "not-supported" }
  | { kind: "checking" }
  | { kind: "downloading"; progress: number }
  | { kind: "ready" }
  | { kind: "unavailable"; reason: string };

export type DeviceSetupPort = Pick<ModelPort, "initializeDeviceModel">;

export const hasPromptApi = (scope: object = globalThis): boolean => 
{
    if (scope && ("LanguageModel" in scope)){
        return true;
    }
    return false;
}

export interface InitDeviceModelDeps {
  isSupported?: () => boolean;                 // default: () => hasPromptApi()
  createSetupModel?: () => DeviceSetupPort;    // default: real ONLY_ON_DEVICE model
}

export const initDeviceModel = async (
  onStatus: (status: DeviceModelStatus) => void,
  options: { timeoutMs?: number; signal?: AbortSignal } = {},
  deps: InitDeviceModelDeps = {},
): Promise<DeviceModelStatus> => {

const isSupported = deps.isSupported ?? (() => hasPromptApi());
const createSetupModel = deps.createSetupModel ?? (() => firebaseFactory(buildHybridParams(InferenceMode.ONLY_ON_DEVICE, { language: DEFAULT_LESSON_LANGUAGE })));

// helper: report(status) → calls onStatus(status), then returns status
const report = (status: DeviceModelStatus): DeviceModelStatus => {
    onStatus(status);
    return status;
  };
if (!isSupported())
    { 
        return report({ kind: "not-supported" })
    }
report({ kind: "checking" })

// The SDK can't cancel the download, so progress may keep arriving after we've settled.
let finished = false;

try {
  const model = createSetupModel()
  await withTimeout(
    () =>
      model.initializeDeviceModel((p) => {
        if (!finished) report({ kind: "downloading", progress: Math.min(1, Math.max(0, p)) });
      }),
    { timeoutMs: options.timeoutMs ?? 10 * 60_000, signal: options.signal },
  )
  finished = true;
  return report({ kind: "ready" })
} catch (error) {
  finished = true;
  if (error instanceof AiAbortedError){ return report({ kind: "idle" })}
  else {
  return report({ kind: "unavailable", reason: error instanceof Error ? error.message : String(error) })
}
}
}
