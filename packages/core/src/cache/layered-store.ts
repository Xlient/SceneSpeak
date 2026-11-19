import type { BlobStore } from "./blob-cache";

/** Local first, then shared. Shared failures never reach the caller. */
export const layeredStore = (local: BlobStore, shared: BlobStore): BlobStore => ({
  async get(key) {
    const hit = await local.get(key);
    if (hit) return hit;
    const remote = await shared.get(key).catch(() => undefined);
    if (remote) await local.set(key, remote);
    return remote;
  },

  async set(key, blob) {
    await local.set(key, blob);
    void shared.set(key, blob).catch(() => undefined);
  },
});
