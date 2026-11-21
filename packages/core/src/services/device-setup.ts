import type { DeviceModelStatus } from "../ai/device";
import type { DeviceStatusStore } from "./device-status-store";

const KEY = "scenespeak-device-ai-v1";

export interface SetupMemory {
  wasReady: () => boolean;
  remember: () => void;
  forget: () => void;
}

/** Remembers that on-device AI was set up in this browser. Storage failures just mean Set up shows again. */
export const createSetupMemory = (storage: Storage | undefined): SetupMemory => ({
  wasReady: () => {
    try {
      return storage?.getItem(KEY) === "ready";
    } catch {
      return false;
    }
  },
  remember: () => {
    try {
      storage?.setItem(KEY, "ready");
    } catch {
      // Set up shows again next visit; harmless.
    }
  },
  forget: () => {
    try {
      storage?.removeItem(KEY);
    } catch {
      // Nothing to clean up.
    }
  },
});

export interface DeviceSetup {
  status: DeviceStatusStore;
  /** Starts setup; must be called straight from a click. Progress lands in `status`. */
  initialize: (options?: { signal?: AbortSignal }) => Promise<DeviceModelStatus>;
  /** On load: reconnects without a click when this browser set the model up before. */
  resume: (options?: { signal?: AbortSignal }) => Promise<DeviceModelStatus>;
}

export type InitDevice = (
  onStatus: (status: DeviceModelStatus) => void,
  options?: { signal?: AbortSignal },
) => Promise<DeviceModelStatus>;

export const createDeviceSetup = (status: DeviceStatusStore, init: InitDevice, memory: SetupMemory): DeviceSetup => {
  const track = (result: DeviceModelStatus) => {
    if (result.kind === "ready") memory.remember();
    else if (result.kind === "unavailable" || result.kind === "not-supported") memory.forget();
    return result;
  };
  return {
    status,
    initialize: async (options) => track(await init(status.set, options)),
    resume: async (options) => {
      if (status.get().kind !== "idle" || !memory.wasReady()) return status.get();
      // A silent retry can't download (Chrome needs a click), so a failure falls back to Set up, not an error.
      const quiet = (next: DeviceModelStatus) => status.set(next.kind === "unavailable" ? { kind: "idle" } : next);
      const result = await init(quiet, options);
      if (result.kind === "ready") return result;
      memory.forget();
      return status.get();
    },
  };
};
