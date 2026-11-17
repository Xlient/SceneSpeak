import { EMPTY_PRACTICE, type Practice, parsePractice } from "./streak";

const KEY = "scenespeak-practice-v1";

export interface PracticeStore {
  load: () => Practice;
  save: (practice: Practice) => void;
}

const browserStorage = (): Storage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

// Storage can be missing or throw (private mode, blocked site data); progress then just isn't kept.
export const localPracticeStore = (storage: Storage | undefined = browserStorage()): PracticeStore => ({
  load: () => {
    try {
      const raw = storage?.getItem(KEY);
      return raw ? parsePractice(JSON.parse(raw)) : EMPTY_PRACTICE;
    } catch {
      return EMPTY_PRACTICE;
    }
  },
  save: (practice) => {
    try {
      storage?.setItem(KEY, JSON.stringify(practice));
    } catch {
      // Not persisted; the in-memory streak still shows for this visit.
    }
  },
});
