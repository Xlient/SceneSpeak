import { PRACTICE_KEY } from "../progress/async-practice-store";

// Every key this app writes to AsyncStorage; "Delete my data" removes all of them.
export const BOARD_JOINED_KEY = "scenespeak-board-joined-v1";
export const TOUR_SEEN_KEY = "scenespeak-tour-seen-v1";
export const APP_DATA_KEYS = [PRACTICE_KEY, BOARD_JOINED_KEY, TOUR_SEEN_KEY] as const;

export interface RemovableStorage {
  getItem(key: string): Promise<string | null>;
  multiRemove(keys: readonly string[]): Promise<void>;
}

/** Removes the app's stored data and returns how many keys held something. */
export const clearAppData = async (storage: RemovableStorage): Promise<number> => {
  const values = await Promise.all(APP_DATA_KEYS.map((key) => storage.getItem(key)));
  await storage.multiRemove(APP_DATA_KEYS);
  return values.filter((value) => value !== null).length;
};
