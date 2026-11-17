// Hermes has no Intl.DisplayNames, which core's prompt builders use to name the lesson language.
// This covers `type: "language"` in English only; unknown codes fall back to the code itself.
const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  ar: "Arabic",
  de: "German",
  en: "English",
  es: "Spanish",
  fr: "French",
  hi: "Hindi",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  nl: "Dutch",
  pt: "Portuguese",
  ru: "Russian",
  tr: "Turkish",
  zh: "Chinese",
  "zh-Hans": "Simplified Chinese",
  "zh-Hant": "Traditional Chinese",
};

export const languageName = (code: string): string | undefined =>
  LANGUAGE_NAMES[code] ?? LANGUAGE_NAMES[code.split("-")[0] ?? ""];

class LanguageDisplayNames {
  of(code: string): string | undefined {
    return languageName(code);
  }
}

export const installIntlDisplayNames = (intl: { DisplayNames?: unknown }): void => {
  if (typeof intl.DisplayNames === "function") return;
  intl.DisplayNames = LanguageDisplayNames;
};
