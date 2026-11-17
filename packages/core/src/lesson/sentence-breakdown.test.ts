import { describe, expect, it } from "vitest";
import { type BreakdownWord, SentenceBreakdown, linkWords } from "./sentence-breakdown";

const word = (text: string, role: BreakdownWord["role"] = "noun"): BreakdownWord => ({ text, role, meaning: text, note: null });

describe("SentenceBreakdown", () => {
  it("keeps valid words, maps unknown roles to other and drops broken entries", () => {
    const parsed = SentenceBreakdown.parse({
      structure: "Adjective after the noun.",
      words: [{ text: "café", role: "noun", meaning: "coffee" }, { text: "con", role: "glue", meaning: "with" }, { role: "verb" }],
    });
    expect(parsed.words.map((w) => [w.text, w.role, w.note])).toEqual([
      ["café", "noun", null],
      ["con", "other", null],
    ]);
  });

  it("rejects a breakdown with no usable words", () => {
    expect(SentenceBreakdown.safeParse({ structure: "x", words: [{ nope: 1 }] }).success).toBe(false);
  });
});

describe("linkWords", () => {
  it("links words in order and keeps punctuation outside them", () => {
    const parts = linkWords("¡Hola! Un café, por favor.", [word("Hola", "interjection"), word("café"), word("por favor", "phrase")]);
    expect(parts.map((p) => (p.kind === "word" ? `[${p.text}]` : p.text)).join("")).toBe("¡[Hola]! Un [café], [por favor].");
  });

  it("matches regardless of case and accents", () => {
    const parts = linkWords("Quisiera dos panecillos", [word("quisiera", "verb"), word("panecillos")]);
    expect(parts.filter((p) => p.kind === "word").map((p) => p.text)).toEqual(["Quisiera", "panecillos"]);
  });

  it("leaves words the model skipped or invented as plain text", () => {
    const parts = linkWords("Un café con leche", [word("leche"), word("azúcar")]);
    expect(parts.filter((p) => p.kind === "word").map((p) => p.text)).toEqual(["leche"]);
    expect(parts.map((p) => p.text).join("")).toBe("Un café con leche");
  });
});
