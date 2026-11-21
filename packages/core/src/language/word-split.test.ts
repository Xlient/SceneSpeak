import { describe, expect, it } from "vitest";
import { fallbackSplit, splitWords } from "./word-split";

const words = (parts: ReturnType<typeof splitWords>) => parts.filter((p) => p.kind === "word").map((p) => p.text);
const joined = (parts: ReturnType<typeof splitWords>) => parts.map((p) => p.text).join("");

describe("splitWords", () => {
  it("splits a spaced sentence into words and keeps punctuation as text", () => {
    const parts = splitWords("¡Hola! ¿Qué tal?", "es");
    expect(words(parts)).toEqual(["Hola", "Qué", "tal"]);
    expect(joined(parts)).toBe("¡Hola! ¿Qué tal?");
  });

  it("segments Japanese, which has no spaces", () => {
    const parts = splitWords("いらっしゃいませ！ご注文は？", "ja");
    expect(words(parts).length).toBeGreaterThan(1);
    expect(joined(parts)).toBe("いらっしゃいませ！ご注文は？");
  });

  it("rejoins Japanese fragments but keeps particles separate", () => {
    const icu = (): ReturnType<typeof splitWords> =>
      ["いらっしゃい", "ま", "せ", "！", "ご", "注文", "は", "？"].map((text) => ({ kind: /[！？]/.test(text) ? "text" : "word", text }));
    expect(words(splitWords("", "ja", icu))).toEqual(["いらっしゃいませ", "ご注文", "は"]);
  });

  it("keeps apostrophes and hyphens inside a word", () => {
    expect(words(fallbackSplit("C'est peut-être", "fr"))).toEqual(["C'est", "peut-être"]);
  });

  it("falls back to letter runs without Intl.Segmenter", () => {
    const parts = fallbackSplit("Un café, por favor.", "es");
    expect(words(parts)).toEqual(["Un", "café", "por", "favor"]);
    expect(joined(parts)).toBe("Un café, por favor.");
    expect(parts.filter((p) => p.kind === "text").map((p) => p.text)).toEqual([" ", ", ", " ", "."]);
  });

  it("keeps an unspaced phrase whole in the fallback", () => {
    expect(words(fallbackSplit("いらっしゃいませ！ご注文は？", "ja"))).toEqual(["いらっしゃいませ", "ご注文は"]);
  });

  it("returns nothing for an empty line", () => {
    expect(splitWords("", "es")).toEqual([]);
  });
});
