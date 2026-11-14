import { describe, expect, it, vi } from "vitest";
import { AUTO, createVoicePreferenceStore } from "./voice-preference";

const memoryStorage = (initial: Record<string, string> = {}): Storage => {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
};

describe("voice preference store", () => {
  it("defaults to auto and remembers a choice per language across reloads", () => {
    const storage = memoryStorage();
    const store = createVoicePreferenceStore(storage);
    expect(store.get("es")).toEqual(AUTO);
    store.set("es-ES", { kind: "device", voiceName: "Mónica" });
    expect(createVoicePreferenceStore(storage).get("es-MX")).toEqual({ kind: "device", voiceName: "Mónica" });
    expect(createVoicePreferenceStore(storage).get("fr")).toEqual(AUTO);
  });

  it("notifies subscribers on change", () => {
    const store = createVoicePreferenceStore(memoryStorage());
    const listener = vi.fn();
    store.subscribe(listener);
    store.set("es", { kind: "cloud" });
    expect(listener).toHaveBeenCalledOnce();
  });

  it("ignores corrupt or unknown stored values", () => {
    const store = createVoicePreferenceStore(memoryStorage({ "scenespeak-voice-v1": '{"es":{"kind":"robot"}}' }));
    expect(store.get("es")).toEqual(AUTO);
    expect(createVoicePreferenceStore(memoryStorage({ "scenespeak-voice-v1": "{oops" })).get("es")).toEqual(AUTO);
    expect(createVoicePreferenceStore(undefined).get("es")).toEqual(AUTO);
  });
});

describe("snapshot stability", () => {
  it("returns the same object until the choice changes", () => {
    const store = createVoicePreferenceStore(memoryStorage({ "scenespeak-voice-v1": '{"es":{"kind":"cloud"}}' }));
    const first = store.get("es");
    expect(store.get("es")).toBe(first);
    store.set("es", { kind: "auto" });
    expect(store.get("es")).not.toBe(first);
  });
});
