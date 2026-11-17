import { describe, expect, it } from "vitest";
import { EMPTY_PRACTICE, dayKey, recordLesson } from "@scenespeak/core/progress/streak";
import { type KeyValueStorage, PRACTICE_KEY, asyncPracticeStore } from "./async-practice-store";

const memory = (initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } => {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => Promise.resolve(data[key] ?? null),
    setItem: (key, value) => {
      data[key] = value;
      return Promise.resolve();
    },
  };
};

describe("asyncPracticeStore", () => {
  it("round-trips practice", async () => {
    const storage = memory();
    const store = asyncPracticeStore(storage);
    const practice = recordLesson(EMPTY_PRACTICE, dayKey(new Date()), { lessonId: "x", goalsDone: 2, goalsTotal: 3, speaking: false, xp: 20 });
    await store.save(practice);
    expect(await store.load()).toEqual(practice);
  });

  it("starts fresh on missing or corrupt data", async () => {
    expect(await asyncPracticeStore(memory()).load()).toEqual(EMPTY_PRACTICE);
    expect(await asyncPracticeStore(memory({ [PRACTICE_KEY]: "{oops" })).load()).toEqual(EMPTY_PRACTICE);
  });

  it("survives a storage that throws", async () => {
    const broken: KeyValueStorage = { getItem: () => Promise.reject(new Error("x")), setItem: () => Promise.reject(new Error("x")) };
    const store = asyncPracticeStore(broken);
    await expect(store.save(EMPTY_PRACTICE)).resolves.toBeUndefined();
    expect(await store.load()).toEqual(EMPTY_PRACTICE);
  });
});
