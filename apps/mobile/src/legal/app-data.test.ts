import { describe, expect, it } from "vitest";
import { APP_DATA_KEYS, type RemovableStorage, clearAppData } from "./app-data";

const memory = (data: Record<string, string>): RemovableStorage & { data: Record<string, string> } => ({
  data,
  getItem: (key) => Promise.resolve(data[key] ?? null),
  multiRemove: (keys) => {
    for (const key of keys) delete data[key];
    return Promise.resolve();
  },
});

describe("clearAppData", () => {
  it("removes every app key and counts the ones that held data", async () => {
    const [first] = APP_DATA_KEYS;
    const storage = memory({ [first]: "{}", unrelated: "keep" });
    expect(await clearAppData(storage)).toBe(1);
    expect(storage.data).toEqual({ unrelated: "keep" });
  });

  it("reports zero when there was nothing to delete", async () => {
    expect(await clearAppData(memory({}))).toBe(0);
  });
});
