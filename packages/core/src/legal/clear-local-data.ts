const PREFIX = "scenespeak-";

export interface LocalDataDeps {
  storage: Storage | undefined;
  caches: CacheStorage | undefined;
}

/** Removes everything SceneSpeak keeps in this browser: progress, preferences and cached voice clips and backdrops. */
export const clearLocalData = async ({ storage, caches }: LocalDataDeps): Promise<number> => {
  let removed = 0;
  if (storage) {
    const keys = Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter(
      (key): key is string => key !== null && key.startsWith(PREFIX),
    );
    for (const key of keys) storage.removeItem(key);
    removed += keys.length;
  }
  if (caches) {
    const names = (await caches.keys()).filter((name) => name.startsWith(PREFIX));
    await Promise.all(names.map((name) => caches.delete(name)));
    removed += names.length;
  }
  return removed;
};

export const browserLocalData = (): LocalDataDeps => {
  const safe = <T>(read: () => T): T | undefined => {
    try {
      return read();
    } catch {
      return undefined;
    }
  };
  return { storage: safe(() => globalThis.localStorage), caches: safe(() => globalThis.caches) };
};
