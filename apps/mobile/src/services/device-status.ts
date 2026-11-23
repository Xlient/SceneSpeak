import type { DeviceModelInfo, HybridModel } from "../ai-port/hybrid-model";

const STATUS_TIMEOUT_MS = 5_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;
const POLL_MS = 3_000;

export interface DeviceStatusStore {
  get(): DeviceModelInfo;
  subscribe(listener: () => void): () => void;
  refresh(): Promise<void>;
  /** Starts the model download where the platform allows it (Android). */
  download(): Promise<void>;
}

/** The native model's state, shared by routing and the welcome tour. Unknown until the port answers. */
export const createDeviceStatusStore = (port: HybridModel, pollMs = POLL_MS): DeviceStatusStore => {
  let info: DeviceModelInfo = { status: "unavailable", reason: "Checking on-device AI…" };
  let poll: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const set = (next: DeviceModelInfo) => {
    info = next;
    for (const listener of listeners) listener();
  };
  const signal = () => new AbortController().signal;
  const refresh = () => call(() => port.status({ signal: signal(), timeoutMs: STATUS_TIMEOUT_MS }));
  const call = async (run: () => Promise<DeviceModelInfo>) => {
    try {
      set(await run());
    } catch {
      set({ status: "unavailable", reason: "On-device AI couldn't start." });
    }
    // A download can outlast the call (or have started before launch): keep checking until it settles.
    clearTimeout(poll);
    if (info.status === "downloading") poll = setTimeout(() => void refresh(), pollMs);
  };
  return {
    get: () => info,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh,
    download: () => {
      clearTimeout(poll);
      set({ ...info, status: "downloading" });
      return call(() => port.download({ signal: signal(), timeoutMs: DOWNLOAD_TIMEOUT_MS, onUpdate: set }));
    },
  };
};
