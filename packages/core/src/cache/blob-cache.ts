export interface BlobStore {
  get(key: string): Promise<Blob | undefined>;
  set(key: string, blob: Blob): Promise<void>;
}

export const createMemoryStore = (): BlobStore => {
  const blobs = new Map<string, Blob>();
  return {
    get: (key) => Promise.resolve(blobs.get(key)),
    set: (key, blob) => {
      blobs.set(key, blob);
      return Promise.resolve();
    },
  };
};

const CACHE_ORIGIN = "https://scenespeak.cache/";

/** Cache Storage keeps generated media across reloads; falls back to memory where it's missing (tests, old browsers). */
export const createCacheStorageStore = (name: string): BlobStore => {
  if (typeof caches === "undefined") return createMemoryStore();
  const open = caches.open(name);
  const url = (key: string) => CACHE_ORIGIN + encodeURIComponent(key);
  return {
    async get(key) {
      const response = await (await open).match(url(key));
      return response ? response.blob() : undefined;
    },
    async set(key, blob) {
      await (await open).put(url(key), new Response(blob, { headers: { "content-type": blob.type } }));
    },
  };
};

interface Keyed {
  cacheKey: string;
}

/** Generate once per key: cached results come from the store and concurrent requests share one call. Failures aren't cached. */
export const cachedBlobSource = <R extends Keyed>(source: (request: R) => Promise<Blob>, store: BlobStore) => {
  const inFlight = new Map<string, Promise<Blob>>();
  return async (request: R): Promise<Blob> => {
    const cached = await store.get(request.cacheKey);
    if (cached) return cached;
    const pending = inFlight.get(request.cacheKey);
    if (pending) return pending;
    const call = source(request)
      .then(async (blob) => {
        await store.set(request.cacheKey, blob);
        return blob;
      })
      .finally(() => inFlight.delete(request.cacheKey));
    inFlight.set(request.cacheKey, call);
    return call;
  };
};

/** FNV-1a, so changed text gets a new cache key. Not for security. */
export const hashText = (text: string): string => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
};

export const speechCacheKey = (lessonId: string, lineId: string, characterId: string, text: string): string =>
  `tts:${lessonId}:${lineId}:${characterId}:${hashText(text)}`;

/** Bump BACKDROP_STYLE_VERSION when the backdrop prompt changes, so old paintings are replaced. */
export const BACKDROP_STYLE_VERSION = 2;
export const backdropCacheKey = (lessonId: string, setting: string, room: string): string =>
  `backdrop:v${BACKDROP_STYLE_VERSION}:${lessonId}:${hashText(`${room}|${setting}`)}`;
