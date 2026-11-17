import { describe, expect, it } from "vitest";
import { createTourStore } from "./tour-store";

const memoryStorage = (): Storage => {
  const data = new Map<string, string>();
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

describe("createTourStore", () => {
  it("starts unseen and remembers once marked", () => {
    const storage = memoryStorage();
    expect(createTourStore(storage).seen()).toBe(false);
    createTourStore(storage).markSeen();
    expect(createTourStore(storage).seen()).toBe(true);
  });

  it("treats missing or broken storage as unseen", () => {
    const broken = { ...memoryStorage(), getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(createTourStore(undefined).seen()).toBe(false);
    expect(() => createTourStore(broken).markSeen()).not.toThrow();
    expect(createTourStore(broken).seen()).toBe(false);
  });
});
