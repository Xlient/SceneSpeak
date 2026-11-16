const KEY = "scenespeak-tour-v1";

export interface TourStore {
  seen: () => boolean;
  markSeen: () => void;
}

/** Remembers in this browser that the welcome tour was shown. Storage failures mean it may show again. */
export const createTourStore = (storage: Storage | undefined): TourStore => ({
  seen: () => {
    try {
      return storage?.getItem(KEY) === "seen";
    } catch {
      return false;
    }
  },
  markSeen: () => {
    try {
      storage?.setItem(KEY, "seen");
    } catch {
      // Shown again next visit; harmless.
    }
  },
});

const browserStorage = (): Storage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export const tourStore = createTourStore(browserStorage());
