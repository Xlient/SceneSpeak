import { describe, expect, it } from "vitest";
import {
  LESSON_LANGUAGES,
  LessonLanguageCode,
  findLanguage,
  isOnDeviceLanguage,
  languageName,
  modelLanguages,
  romanizationOf,
  speechLocale,
} from "./languages";

describe("lesson languages", () => {
  it("matches Chrome's documented on-device list", () => {
    expect(LESSON_LANGUAGES.filter((l) => l.onDevice).map((l) => l.code)).toEqual(["es", "fr", "de", "ja"]);
  });

  it("has unique codes and a cloud-only option", () => {
    const codes = LESSON_LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(LESSON_LANGUAGES.some((l) => !l.onDevice)).toBe(true);
  });

  it("validates codes with Zod and drops unknown ones", () => {
    expect(LessonLanguageCode.parse("ja")).toBe("ja");
    expect(LessonLanguageCode.safeParse("Spanish").success).toBe(false);
    expect(LessonLanguageCode.safeParse("xx").success).toBe(false);
  });

  it("finds regional variants by base language", () => {
    expect(findLanguage("es-MX")?.name).toBe("Spanish");
    expect(findLanguage("PT-br")?.code).toBe("pt");
    expect(findLanguage("nl")).toBeUndefined();
  });

  it("treats English and the registry's on-device languages as on-device", () => {
    expect(isOnDeviceLanguage("en")).toBe(true);
    expect(isOnDeviceLanguage("fr-CA")).toBe(true);
    expect(isOnDeviceLanguage("ko")).toBe(false);
    expect(isOnDeviceLanguage("nl")).toBe(false);
  });

  it("names languages from the registry, then Intl, then the code", () => {
    expect(languageName("zh")).toBe("Chinese");
    expect(languageName("nl")).toBe("Dutch");
    expect(languageName("not a code")).toBe("not a code");
  });

  it("tells Nano to expect English plus supported lesson languages only", () => {
    expect(modelLanguages("de")).toEqual(["en", "de"]);
    expect(modelLanguages("ja-JP")).toEqual(["en", "ja"]);
    expect(modelLanguages("it")).toEqual(["en"]);
    expect(modelLanguages("en")).toEqual(["en"]);
    expect(modelLanguages(undefined)).toEqual(["en"]);
  });

  it("maps bare codes to a speech locale and keeps regional tags", () => {
    expect(speechLocale("pt")).toBe("pt-BR");
    expect(speechLocale("es-MX")).toBe("es-MX");
    expect(speechLocale("nl")).toBe("nl");
  });

  it("knows which languages learners may romanize", () => {
    expect(romanizationOf("ja")).toBe("romaji");
    expect(romanizationOf("zh")).toBe("pinyin");
    expect(romanizationOf("fr")).toBeNull();
  });
});
