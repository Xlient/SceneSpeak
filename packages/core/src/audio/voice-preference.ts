import { z } from "zod";

export const VoiceChoice = z.discriminatedUnion("kind", [
  /** Best device voice now; the cloud AI voice once its clip is cached. */
  z.object({ kind: z.literal("auto") }),
  /** Always the cloud AI voice (falls back to the device while it isn't available). */
  z.object({ kind: z.literal("cloud") }),
  /** One installed voice, by name. */
  z.object({ kind: z.literal("device"), voiceName: z.string().min(1).max(200) }),
]);
export type VoiceChoice = z.infer<typeof VoiceChoice>;

const Preferences = z.record(z.string(), z.unknown()).catch({});

export const AUTO: VoiceChoice = { kind: "auto" };
const KEY = "scenespeak-voice-v1";

const languageKey = (lang: string) => lang.toLowerCase().split(/[-_]/)[0] ?? lang;

export interface VoicePreferenceStore {
  get: (lang: string) => VoiceChoice;
  set: (lang: string, choice: VoiceChoice) => void;
  subscribe: (listener: () => void) => () => void;
}

/** Per-language voice choice, kept in this browser only. Storage failures just mean it isn't remembered. */
export const createVoicePreferenceStore = (storage: Storage | undefined): VoicePreferenceStore => {
  const read = (): Record<string, unknown> => {
    try {
      const raw = storage?.getItem(KEY);
      return raw ? Preferences.parse(JSON.parse(raw)) : {};
    } catch {
      return {};
    }
  };
  let prefs = read();
  // Same object until it changes, so React's useSyncExternalStore doesn't re-render forever.
  const parsedCache = new Map<string, VoiceChoice>();
  const listeners = new Set<() => void>();
  return {
    get: (lang) => {
      const key = languageKey(lang);
      const cached = parsedCache.get(key);
      if (cached) return cached;
      const parsed = VoiceChoice.safeParse(prefs[key]);
      const choice = parsed.success ? parsed.data : AUTO;
      parsedCache.set(key, choice);
      return choice;
    },
    set: (lang, choice) => {
      prefs = { ...prefs, [languageKey(lang)]: choice };
      parsedCache.delete(languageKey(lang));
      try {
        storage?.setItem(KEY, JSON.stringify(prefs));
      } catch {
        // Kept for this visit only.
      }
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

const browserStorage = (): Storage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export const voicePreferences = createVoicePreferenceStore(browserStorage());
