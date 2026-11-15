export interface Redaction {
  text: string;
  redacted: number;
}

const RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email]"],
  [/(?:\+?\d[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}/g, "[phone]"],
  // Card, account and ID numbers; short numbers like ages and times stay.
  [/\d{9,}/g, "[number]"],
];

export const redactPii = (input: string): Redaction => {
  let redacted = 0;
  const text = RULES.reduce(
    (current, [pattern, label]) =>
      current.replace(pattern, () => {
        redacted += 1;
        return label;
      }),
    input,
  );
  return { text, redacted };
};
