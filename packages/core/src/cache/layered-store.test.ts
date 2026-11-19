import { describe, expect, it, vi } from "vitest";
import { type BlobStore, createMemoryStore } from "./blob-cache";
import { layeredStore } from "./layered-store";

const blob = (text: string) => new Blob([text], { type: "image/jpeg" });
const spyStore = (store: BlobStore = createMemoryStore()) => ({ get: vi.fn(store.get), set: vi.fn(store.set) });

describe("layeredStore", () => {
  it("serves a local hit without asking the shared store", async () => {
    const local = spyStore();
    const shared = spyStore();
    await local.set("k", blob("local"));
    expect(await (await layeredStore(local, shared).get("k"))?.text()).toBe("local");
    expect(shared.get).not.toHaveBeenCalled();
  });

  it("falls back to the shared store and copies the hit locally", async () => {
    const local = spyStore();
    const shared = spyStore();
    await shared.set("k", blob("shared"));
    expect(await (await layeredStore(local, shared).get("k"))?.text()).toBe("shared");
    expect(await (await local.get("k"))?.text()).toBe("shared");
  });

  it("is a miss when neither has it", async () => {
    expect(await layeredStore(createMemoryStore(), createMemoryStore()).get("k")).toBeUndefined();
  });

  it("treats a failing shared store as a miss", async () => {
    const shared: BlobStore = { get: () => Promise.reject(new Error("offline")), set: () => Promise.resolve() };
    expect(await layeredStore(createMemoryStore(), shared).get("k")).toBeUndefined();
  });

  it("writes to both stores", async () => {
    const local = spyStore();
    const shared = spyStore();
    await layeredStore(local, shared).set("k", blob("new"));
    expect(local.set).toHaveBeenCalledWith("k", expect.any(Blob));
    await vi.waitFor(() => expect(shared.set).toHaveBeenCalledWith("k", expect.any(Blob)));
  });

  it("never fails a write because sharing failed", async () => {
    const shared: BlobStore = { get: () => Promise.resolve(undefined), set: () => Promise.reject(new Error("permission denied")) };
    await expect(layeredStore(createMemoryStore(), shared).set("k", blob("x"))).resolves.toBeUndefined();
  });
});
