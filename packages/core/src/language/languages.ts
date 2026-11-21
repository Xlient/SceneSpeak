import { z } from "zod";

export interface LessonLanguage {
  code: string;
  name: string;
  nativeName: string;
  /** Chrome's Prompt API (Gemini Nano) accepts it for text in and out. */
  onDevice: boolean;
  /** Preferred speech-synthesis locale. */
  ttsLocale: string;
  /** False for scripts written without spaces between words. */
  spaced: boolean;
  /** Short greeting for voice previews. */
  sample: string;
  /** How learners type it on a Latin keyboard, for languages not written in Latin letters. */
  romanization: string | null;
}

// On-device set from developer.chrome.com/docs/ai/prompt-api (Oct 2026): en, ja, es, de, fr.
export const LESSON_LANGUAGES = [
  { code: "es", name: "Spanish", nativeName: "Español", onDevice: true, ttsLocale: "es-ES", spaced: true, sample: "¡Hola! Encantado de conocerte.", romanization: null },
  { code: "fr", name: "French", nativeName: "Français", onDevice: true, ttsLocale: "fr-FR", spaced: true, sample: "Bonjour ! Ravi de te rencontrer.", romanization: null },
  { code: "de", name: "German", nativeName: "Deutsch", onDevice: true, ttsLocale: "de-DE", spaced: true, sample: "Hallo! Schön, dich kennenzulernen.", romanization: null },
  { code: "ja", name: "Japanese", nativeName: "日本語", onDevice: true, ttsLocale: "ja-JP", spaced: false, sample: "こんにちは！はじめまして。", romanization: "romaji" },
  { code: "it", name: "Italian", nativeName: "Italiano", onDevice: false, ttsLocale: "it-IT", spaced: true, sample: "Ciao! Piacere di conoscerti.", romanization: null },
  { code: "pt", name: "Portuguese", nativeName: "Português", onDevice: false, ttsLocale: "pt-BR", spaced: true, sample: "Olá! Prazer em te conhecer.", romanization: null },
  { code: "ko", name: "Korean", nativeName: "한국어", onDevice: false, ttsLocale: "ko-KR", spaced: true, sample: "안녕하세요! 만나서 반가워요.", romanization: "Revised Romanization" },
  { code: "zh", name: "Chinese", nativeName: "中文", onDevice: false, ttsLocale: "zh-CN", spaced: false, sample: "你好！很高兴认识你。", romanization: "pinyin" },
] as const satisfies readonly LessonLanguage[];

export type LessonLanguageCode = (typeof LESSON_LANGUAGES)[number]["code"];

const CODES = LESSON_LANGUAGES.map((l) => l.code) as [LessonLanguageCode, ...LessonLanguageCode[]];
export const LessonLanguageCode = z.enum(CODES);

export const DEFAULT_LESSON_LANGUAGE: LessonLanguageCode = "es";

export const baseLanguage = (code: string): string => code.split("-")[0]?.toLowerCase() ?? code;

/** Registry entry for a code or a regional variant of it ("es-MX" → Spanish). */
export const findLanguage = (code: string): LessonLanguage | undefined => {
  const base = baseLanguage(code);
  return LESSON_LANGUAGES.find((l) => l.code === base);
};

export const isLessonLanguage = (code: unknown): code is LessonLanguageCode => LessonLanguageCode.safeParse(code).success;

/** English learners' UI plus Chrome's own list; languages outside the registry (community lessons) go to the cloud. */
export const isOnDeviceLanguage = (code: string): boolean => baseLanguage(code) === "en" || findLanguage(code)?.onDevice === true;

export const languageName = (code: string): string => {
  const known = findLanguage(code);
  if (known) return known.name;
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
};

/** What to tell Nano to expect: English (instructions, hints) plus the lesson language when it's supported. */
export const modelLanguages = (code: string | undefined): string[] => {
  if (code === undefined) return ["en"];
  const base = baseLanguage(code);
  return base !== "en" && isOnDeviceLanguage(base) ? ["en", base] : ["en"];
};

/** A bare code gets the registry's speech locale ("pt" → "pt-BR"); a regional tag is kept as is. */
export const speechLocale = (code: string): string => (/[-_]/.test(code) ? code : (findLanguage(code)?.ttsLocale ?? code));

export const isSpacedScript = (code: string): boolean => findLanguage(code)?.spaced ?? true;

export const romanizationOf = (code: string): string | null => findLanguage(code)?.romanization ?? null;
