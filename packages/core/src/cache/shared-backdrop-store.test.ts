import { describe, expect, it, vi } from "vitest";
import { type BackdropCloudPort, MAX_SHARED_BYTES, createSharedBackdropStore } from "./shared-backdrop-store";

const KEY = "f".repeat(64);
const PATH = `backdrops/${KEY}.jpg`;

/** In-memory stand-in for Firestore + Storage. */
const fakeCloud = () => {
  const entries = new Map<string, unknown>();
  const files = new Map<string, Blob>();
  const port = {
    readEntry: vi.fn(async (key: string) => entries.get(key)),
    createEntry: vi.fn(async (key: string, entry: unknown) => void entries.set(key, entry)),
    download: vi.fn(async (path: string) => {
      const file = files.get(path);
      if (!file) throw new Error("not found");
      return file;
    }),
    upload: vi.fn(async (path: string, blob: Blob) => void files.set(path, blob)),
  } satisfies BackdropCloudPort;
  return { port, entries, files };
};

const jpeg = (text = "img") => new Blob([text], { type: "image/jpeg" });

describe("createSharedBackdropStore", () => {
  it("round-trips: what one user stores, another reads", async () => {
    const cloud = fakeCloud();
    await createSharedBackdropStore(cloud.port).set(KEY, jpeg("painted"));
    const read = await createSharedBackdropStore(cloud.port).get(KEY);
    expect(read?.type).toBe("image/jpeg");
    expect(await read?.text()).toBe("painted");
  });

  it("uploads the file before writing the index entry", async () => {
    const cloud = fakeCloud();
    await createSharedBackdropStore(cloud.port).set(KEY, jpeg());
    expect(cloud.port.upload).toHaveBeenCalledWith(PATH, expect.any(Blob), "image/jpeg");
    expect(cloud.port.createEntry).toHaveBeenCalledWith(KEY, { path: PATH, contentType: "image/jpeg" });
    expect(cloud.port.upload.mock.invocationCallOrder[0]).toBeLessThan(cloud.port.createEntry.mock.invocationCallOrder[0] ?? 0);
  });

  it("is a miss when there's no entry, without downloading", async () => {
    const cloud = fakeCloud();
    expect(await createSharedBackdropStore(cloud.port).get(KEY)).toBeUndefined();
    expect(cloud.port.download).not.toHaveBeenCalled();
  });

  it("ignores entries that are malformed or point at another file", async () => {
    const cloud = fakeCloud();
    const store = createSharedBackdropStore(cloud.port);
    cloud.entries.set(KEY, { path: PATH, contentType: "text/html" });
    expect(await store.get(KEY)).toBeUndefined();
    cloud.entries.set(KEY, { path: `backdrops/${"0".repeat(64)}.jpg`, contentType: "image/jpeg" });
    expect(await store.get(KEY)).toBeUndefined();
    expect(cloud.port.download).not.toHaveBeenCalled();
  });

  it("skips files the rules would refuse, without calling Firebase", async () => {
    const cloud = fakeCloud();
    const store = createSharedBackdropStore(cloud.port);
    await store.set(KEY, new Blob(["<html>"], { type: "text/html" }));
    await store.set(KEY, new Blob([], { type: "image/jpeg" }));
    await store.set(KEY, new Blob([new Uint8Array(MAX_SHARED_BYTES + 1)], { type: "image/jpeg" }));
    expect(cloud.port.upload).not.toHaveBeenCalled();
    expect(cloud.port.createEntry).not.toHaveBeenCalled();
  });

  it("uses the right extension for each image type", async () => {
    const cloud = fakeCloud();
    await createSharedBackdropStore(cloud.port).set(KEY, new Blob(["p"], { type: "image/png" }));
    expect(cloud.port.upload).toHaveBeenCalledWith(`backdrops/${KEY}.png`, expect.any(Blob), "image/png");
  });
});
