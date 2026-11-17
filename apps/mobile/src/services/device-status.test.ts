import { describe, expect, it, vi } from "vitest";
import type { HybridModel } from "../ai-port/hybrid-model";
import { createUnavailableModel } from "../ai-port/unavailable-model";
import { createDeviceStatusStore } from "./device-status";

describe("createDeviceStatusStore", () => {
  it("takes the port's status and notifies listeners", async () => {
    const port: HybridModel = { ...createUnavailableModel("x"), status: () => Promise.resolve({ status: "downloadable" }) };
    const store = createDeviceStatusStore(port);
    const listener = vi.fn();
    store.subscribe(listener);
    await store.refresh();
    expect(store.get().status).toBe("downloadable");
    expect(listener).toHaveBeenCalled();
  });

  it("shows downloading, then the result of the download", async () => {
    const port: HybridModel = { ...createUnavailableModel("x"), download: () => Promise.resolve({ status: "available" }) };
    const store = createDeviceStatusStore(port);
    const pending = store.download();
    expect(store.get().status).toBe("downloading");
    await pending;
    expect(store.get().status).toBe("available");
  });

  it("falls back to unavailable when the port throws", async () => {
    const port: HybridModel = { ...createUnavailableModel("x"), status: () => Promise.reject(new Error("boom")) };
    const store = createDeviceStatusStore(port);
    await store.refresh();
    expect(store.get().status).toBe("unavailable");
  });
});
