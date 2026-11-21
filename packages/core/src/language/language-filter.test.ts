import { describe, expect, it } from "vitest";
import { isCloudOnly, languageFilterOptions, languagesByInference, matchesLanguage } from "./language-filter";

describe("matchesLanguage", () => {
  it("matches everything when the filter is null", () => {
    expect(matchesLanguage("ko", null)).toBe(true);
  });

  it("matches by base language, ignoring region and case", () => {
    expect(matchesLanguage("pt-BR", "pt")).toBe(true);
    expect(matchesLanguage("ES", "es")).toBe(true);
    expect(matchesLanguage("ja", "zh")).toBe(false);
  });
});

describe("languageFilterOptions", () => {
  it("lists registry languages, then other codes found in lessons", () => {
    const options = languageFilterOptions(["nl", "es-MX", "ar", "nl-BE"]);
    expect(options.slice(0, 4)).toEqual(["es", "fr", "de", "ja"]);
    expect(options.slice(-2)).toEqual(["ar", "nl"]);
    expect(options.filter((o) => o === "es")).toHaveLength(1);
  });
});

describe("cloud-only languages", () => {
  it("marks languages Nano can't speak, including ones outside the registry", () => {
    expect(isCloudOnly("ko")).toBe(true);
    expect(isCloudOnly("nl")).toBe(true);
    expect(isCloudOnly("fr-CA")).toBe(false);
  });

  it("splits the picker into on-device and cloud-only groups", () => {
    const { onDevice, cloudOnly } = languagesByInference();
    expect(onDevice.map((l) => l.code)).toEqual(["es", "fr", "de", "ja"]);
    expect(cloudOnly.map((l) => l.code)).toEqual(["it", "pt", "ko", "zh"]);
  });
});
