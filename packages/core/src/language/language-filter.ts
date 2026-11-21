import { LESSON_LANGUAGES, baseLanguage, isOnDeviceLanguage } from "./languages";

type RegistryLanguage = (typeof LESSON_LANGUAGES)[number];

/** A base language code, or null for every language. */
export type LanguageFilter = string | null;

export const matchesLanguage = (code: string, filter: LanguageFilter): boolean =>
  filter === null || baseLanguage(code) === baseLanguage(filter);

/** Registry languages first (in registry order), then any other base codes found in `codes`, A to Z. */
export const languageFilterOptions = (codes: readonly string[]): string[] => {
  const known = LESSON_LANGUAGES.map((l) => l.code as string);
  const extra = [...new Set(codes.map(baseLanguage))].filter((code) => !known.includes(code)).toSorted();
  return [...known, ...extra];
};

export const isCloudOnly = (code: string): boolean => !isOnDeviceLanguage(code);

/** The Create picker's two groups, so cloud-only languages are visible before they're picked. */
export const languagesByInference = (): { onDevice: RegistryLanguage[]; cloudOnly: RegistryLanguage[] } => ({
  onDevice: LESSON_LANGUAGES.filter((l) => l.onDevice),
  cloudOnly: LESSON_LANGUAGES.filter((l) => !l.onDevice),
});
