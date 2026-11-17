import { describe, expect, it } from "vitest";
import { LanguagePack } from "./language-pack";

const valid = {
  language: "es",
  script: "latin",
  direction: "ltr",
  acceptsRomanization: false,
  lenientDiacritics: true,
  phrases: {
    greet: { phrase: "Hola", alternatives: ["Buenos días"], translation: "Hello" },
    ask_bill: {
      phrase: "La cuenta, por favor",
      alternatives: [],
      translation: "The bill, please",
      cultureNote: "In Spain the bill usually comes only when you ask.",
    },
  },
};

describe("LanguagePack", () => {
  it("parses a valid pack", () => {
    expect(LanguagePack.parse(valid)).toEqual(valid);
  });

  it("parses a hanzi pack with romanization", () => {
    const zh = {
      ...valid,
      language: "zh-Hans",
      script: "hanzi",
      acceptsRomanization: true,
      lenientDiacritics: false,
      phrases: { greet: { phrase: "你好", alternatives: ["nǐ hǎo"], translation: "Hello" } },
    };
    expect(LanguagePack.parse(zh).phrases.greet?.phrase).toBe("你好");
  });

  it("rejects an unknown script or direction", () => {
    expect(LanguagePack.safeParse({ ...valid, script: "cyrillic" }).success).toBe(false);
    expect(LanguagePack.safeParse({ ...valid, direction: "ttb" }).success).toBe(false);
  });

  it("rejects a phrase entry without a translation", () => {
    expect(LanguagePack.safeParse({ ...valid, phrases: { greet: { phrase: "Hola" } } }).success).toBe(false);
  });

  it("drops phrases for unknown intents", () => {
    const parsed = LanguagePack.parse({ ...valid, phrases: { ...valid.phrases, juggle: { phrase: "x", translation: "y" } } });
    expect(Object.keys(parsed.phrases).sort()).toEqual(["ask_bill", "greet"]);
  });

  it("defaults and caps alternatives", () => {
    const parsed = LanguagePack.parse({
      ...valid,
      phrases: {
        greet: { phrase: "Hola", translation: "Hello" },
        thank: { phrase: "Gracias", alternatives: Array.from({ length: 12 }, (_, i) => `alt${i}`), translation: "Thanks" },
      },
    });
    expect(parsed.phrases.greet?.alternatives).toEqual([]);
    expect(parsed.phrases.thank?.alternatives).toHaveLength(8);
  });
});
