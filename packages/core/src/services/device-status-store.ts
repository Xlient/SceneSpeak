import type { DeviceModelStatus } from "../ai/device";

/** Shared so the header pill and the router see the same on-device state. */
export interface DeviceStatusStore {
  get(): DeviceModelStatus;
  set(status: DeviceModelStatus): void;
  subscribe(listener: () => void): () => void;
}

export const createDeviceStatusStore = (initial: DeviceModelStatus): DeviceStatusStore => {
  let status = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => status,
    set(next) {
      status = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};
