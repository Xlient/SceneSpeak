import { afterEach, describe, expect, it, vi } from "vitest";
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

  describe("while a download runs", () => {
    afterEach(() => vi.useRealTimers());

    it("passes progress updates through", async () => {
      const seen: (number | undefined)[] = [];
      const port: HybridModel = {
        ...createUnavailableModel("x"),
        download: ({ onUpdate }) => {
          onUpdate?.({ status: "downloading", progress: 0.4 });
          return Promise.resolve({ status: "available" });
        },
      };
      const store = createDeviceStatusStore(port);
      store.subscribe(() => seen.push(store.get().progress));
      await store.download();
      expect(seen).toContain(0.4);
    });

    it("keeps checking until the download settles", async () => {
      vi.useFakeTimers();
      const status = vi.fn().mockResolvedValueOnce({ status: "downloading", progress: 0.9 }).mockResolvedValue({ status: "available" });
      const store = createDeviceStatusStore({ ...createUnavailableModel("x"), status }, 10);
      await store.refresh();
      expect(store.get()).toEqual({ status: "downloading", progress: 0.9 });
      await vi.advanceTimersByTimeAsync(10);
      expect(store.get().status).toBe("available");
      await vi.advanceTimersByTimeAsync(50);
      expect(status).toHaveBeenCalledTimes(2);
    });
  });
});
