import { describe, expect, it, vi } from "vitest";
import { createDeviceStatusStore } from "./device-status-store";

describe("createDeviceStatusStore", () => {
  it("starts with the initial status", () => {
    expect(createDeviceStatusStore({ kind: "idle" }).get()).toEqual({ kind: "idle" });
  });

  it("notifies listeners on set until they unsubscribe", () => {
    const store = createDeviceStatusStore({ kind: "idle" });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.set({ kind: "ready" });
    unsubscribe();
    store.set({ kind: "checking" });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toEqual({ kind: "checking" });
  });
});
