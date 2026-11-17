import { describe, expect, it, vi } from "vitest";
import { clearLocalData } from "./clear-local-data";

const storageWith = (entries: Record<string, string>): Storage => {
  const data = new Map(Object.entries(entries));
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

describe("clearLocalData", () => {
  it("removes only SceneSpeak's storage keys and caches", async () => {
    const storage = storageWith({ "scenespeak-practice-v1": "{}", "scenespeak-tour-v1": "seen", "other-app": "keep" });
    const deleted: string[] = [];
    const caches = {
      keys: vi.fn(async () => ["scenespeak-tts-v1", "scenespeak-backdrops-v1", "someone-else"]),
      delete: vi.fn(async (name: string) => {
        deleted.push(name);
        return true;
      }),
    } as unknown as CacheStorage;

    expect(await clearLocalData({ storage, caches })).toBe(4);
    expect(storage.getItem("other-app")).toBe("keep");
    expect(storage.length).toBe(1);
    expect(deleted).toEqual(["scenespeak-tts-v1", "scenespeak-backdrops-v1"]);
  });

  it("copes without storage or caches", async () => {
    expect(await clearLocalData({ storage: undefined, caches: undefined })).toBe(0);
  });
});
