import type { DeviceModelInfo, HybridModel } from "../ai-port/hybrid-model";

const STATUS_TIMEOUT_MS = 5_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;

export interface DeviceStatusStore {
  get(): DeviceModelInfo;
  subscribe(listener: () => void): () => void;
  refresh(): Promise<void>;
  /** Starts the model download where the platform allows it (Android). */
  download(): Promise<void>;
}

/** The native model's state, shared by routing and the welcome tour. Unknown until the port answers. */
export const createDeviceStatusStore = (port: HybridModel): DeviceStatusStore => {
  let info: DeviceModelInfo = { status: "unavailable", reason: "Checking on-device AI…" };
  const listeners = new Set<() => void>();
  const set = (next: DeviceModelInfo) => {
    info = next;
    for (const listener of listeners) listener();
  };
  const call = async (run: () => Promise<DeviceModelInfo>) => {
    try {
      set(await run());
    } catch {
      set({ status: "unavailable", reason: "On-device AI couldn't start." });
    }
  };
  return {
    get: () => info,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh: () => call(() => port.status({ signal: new AbortController().signal, timeoutMs: STATUS_TIMEOUT_MS })),
    download: () => {
      set({ ...info, status: "downloading" });
      return call(() => port.download({ signal: new AbortController().signal, timeoutMs: DOWNLOAD_TIMEOUT_MS }));
    },
  };
};
