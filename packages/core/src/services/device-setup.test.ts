import { describe, expect, it, vi } from "vitest";
import type { DeviceModelStatus } from "../ai/device";
import { type InitDevice, type SetupMemory, createDeviceSetup, createSetupMemory } from "./device-setup";
import { createDeviceStatusStore } from "./device-status-store";

const memoryStorage = (): Storage => {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
};

const fakeMemory = (ready: boolean): SetupMemory & { state: boolean } => {
  const m = { state: ready, wasReady: () => m.state, remember: () => void (m.state = true), forget: () => void (m.state = false) };
  return m;
};

const initTo =
  (...statuses: DeviceModelStatus[]): InitDevice =>
  (onStatus) => {
    for (const s of statuses) onStatus(s);
    return Promise.resolve(statuses.at(-1) ?? { kind: "idle" });
  };

describe("createSetupMemory", () => {
  it("remembers and forgets", () => {
    const memory = createSetupMemory(memoryStorage());
    expect(memory.wasReady()).toBe(false);
    memory.remember();
    expect(memory.wasReady()).toBe(true);
    memory.forget();
    expect(memory.wasReady()).toBe(false);
  });

  it("treats broken storage as never set up", () => {
    const broken = { getItem: () => { throw new Error("blocked"); } } as unknown as Storage;
    expect(createSetupMemory(broken).wasReady()).toBe(false);
    expect(createSetupMemory(undefined).wasReady()).toBe(false);
  });
});

describe("createDeviceSetup", () => {
  it("remembers a successful Set up", async () => {
    const memory = fakeMemory(false);
    const setup = createDeviceSetup(createDeviceStatusStore({ kind: "idle" }), initTo({ kind: "checking" }, { kind: "ready" }), memory);
    await setup.initialize();
    expect(memory.state).toBe(true);
  });

  it("forgets when the model becomes unavailable", async () => {
    const memory = fakeMemory(true);
    const setup = createDeviceSetup(createDeviceStatusStore({ kind: "idle" }), initTo({ kind: "unavailable", reason: "x" }), memory);
    await setup.initialize();
    expect(memory.state).toBe(false);
  });

  it("does nothing on load for a browser that never set up", async () => {
    const init = vi.fn(initTo({ kind: "ready" }));
    const setup = createDeviceSetup(createDeviceStatusStore({ kind: "idle" }), init, fakeMemory(false));
    await expect(setup.resume()).resolves.toEqual({ kind: "idle" });
    expect(init).not.toHaveBeenCalled();
  });

  it("reconnects on load when set up before", async () => {
    const status = createDeviceStatusStore({ kind: "idle" });
    const setup = createDeviceSetup(status, initTo({ kind: "checking" }, { kind: "ready" }), fakeMemory(true));
    await setup.resume();
    expect(status.get()).toEqual({ kind: "ready" });
  });

  it("falls back to Set up, not an error, when the silent retry fails", async () => {
    const status = createDeviceStatusStore({ kind: "idle" });
    const memory = fakeMemory(true);
    const setup = createDeviceSetup(status, initTo({ kind: "checking" }, { kind: "unavailable", reason: "needs a click" }), memory);
    await setup.resume();
    expect(status.get()).toEqual({ kind: "idle" });
    expect(memory.state).toBe(false);
  });

  it("leaves a browser without the Prompt API alone", async () => {
    const init = vi.fn(initTo({ kind: "ready" }));
    const setup = createDeviceSetup(createDeviceStatusStore({ kind: "not-supported" }), init, fakeMemory(true));
    await setup.resume();
    expect(init).not.toHaveBeenCalled();
  });
});
