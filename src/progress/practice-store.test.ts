import { describe, expect, it } from "vitest";
import { localPracticeStore } from "./practice-store";
import { EMPTY_PRACTICE } from "./streak";

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

describe("localPracticeStore", () => {
  it("round-trips practice", () => {
    const store = localPracticeStore(memoryStorage());
    const practice = { lastDay: "2026-11-14", streak: 3, best: 4, lessonsDone: 9, xp: 120, history: [] };
    store.save(practice);
    expect(store.load()).toEqual(practice);
  });

  it("returns empty practice when storage is missing, broken or corrupt", () => {
    expect(localPracticeStore(undefined).load()).toEqual(EMPTY_PRACTICE);
    const throwing = { ...memoryStorage(), getItem: () => { throw new Error("blocked"); } };
    expect(localPracticeStore(throwing).load()).toEqual(EMPTY_PRACTICE);
    const corrupt = memoryStorage();
    corrupt.setItem("scenespeak-practice-v1", "{not json");
    expect(localPracticeStore(corrupt).load()).toEqual(EMPTY_PRACTICE);
  });
});
