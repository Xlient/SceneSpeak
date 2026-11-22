export type WordPart = { kind: "word"; text: string } | { kind: "text"; text: string };

type Segmenter = (text: string) => WordPart[];

const intlSegmenter = (language: string): Segmenter | undefined => {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter !== "function") return undefined;
  try {
    const segmenter = new Intl.Segmenter(language, { granularity: "word" });
    return (text) => [...segmenter.segment(text)].map((s) => ({ kind: s.isWordLike ? "word" : "text", text: s.segment }));
  } catch {
    return undefined;
  }
};

// Without Intl.Segmenter (some phone JS engines), fall back to runs of letters; unspaced scripts stay as phrases.
const LETTERS = /([\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*)/u;
// split() with a capture group alternates: odd indexes are the matches.
const regexSplit: Segmenter = (text) =>
  text
    .split(LETTERS)
    .map((part, i): WordPart => ({ kind: i % 2 === 1 ? "word" : "text", text: part }))
    .filter((part) => part.text.length > 0);

/** Merges neighbouring non-word parts so punctuation and spaces render as one run. */
const merge = (parts: WordPart[]): WordPart[] =>
  parts.reduce<WordPart[]>((out, part) => {
    const last = out.at(-1);
    if (last && last.kind === "text" && part.kind === "text") out[out.length - 1] = { kind: "text", text: last.text + part.text };
    else out.push(part);
    return out;
  }, []);

// ICU cuts Japanese finely (いらっしゃい|ま|せ, ご|注文). Rejoin lone kana, except particles that stand alone.
const PARTICLES = new Set(["は", "が", "を", "に", "で", "と", "も", "の", "へ", "や", "か", "ね", "よ"]);
const PREFIXES = new Set(["お", "ご"]);
const LONE_KANA = /^[\p{Script=Hiragana}\p{Script=Katakana}]$/u;

const joinJapanese = (parts: WordPart[]): WordPart[] =>
  parts.reduce<WordPart[]>((out, part) => {
    const last = out.at(-1);
    const prefixed = last?.kind === "word" && PREFIXES.has(last.text);
    const trailing = last?.kind === "word" && LONE_KANA.test(part.text) && !PARTICLES.has(part.text);
    if (part.kind === "word" && last && (prefixed || trailing)) out[out.length - 1] = { kind: "word", text: last.text + part.text };
    else out.push(part);
    return out;
  }, []);

/** Splits a line into tappable words and the text between them, in order. Joining every part gives back the line. */
export const splitWords = (text: string, language: string, segment: Segmenter | undefined = intlSegmenter(language)): WordPart[] => {
  const parts = merge((segment ?? regexSplit)(text));
  return language.toLowerCase().startsWith("ja") ? joinJapanese(parts) : parts;
};

export const fallbackSplit = (text: string, language: string): WordPart[] => splitWords(text, language, regexSplit);
