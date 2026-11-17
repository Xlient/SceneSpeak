import { EMPTY_PRACTICE, type Practice, parsePractice } from "@scenespeak/core/progress/streak";

// Same key and format as the web's localPracticeStore.
export const PRACTICE_KEY = "scenespeak-practice-v1";

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface AsyncPracticeStore {
  load(): Promise<Practice>;
  save(practice: Practice): Promise<void>;
}

/** Practice kept on the device (AsyncStorage). Bad or missing data starts fresh; failed saves only lose persistence. */
export const asyncPracticeStore = (storage: KeyValueStorage): AsyncPracticeStore => ({
  load: async () => {
    try {
      const raw = await storage.getItem(PRACTICE_KEY);
      return raw ? parsePractice(JSON.parse(raw)) : EMPTY_PRACTICE;
    } catch {
      return EMPTY_PRACTICE;
    }
  },
  save: async (practice) => {
    try {
      await storage.setItem(PRACTICE_KEY, JSON.stringify(practice));
    } catch {
      // The in-memory streak still shows for this session.
    }
  },
});
