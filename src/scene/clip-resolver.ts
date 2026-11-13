import type { Animation } from "../schemas";

const CLIP_PATTERNS: Record<Animation, readonly RegExp[]> = {
  idle: [/^idle(_loop)?$/i, /idle/i],
  talk: [/idle_?talking/i, /talk/i],
  wave: [/wave/i],
  nod: [/nod/i, /yes/i],
  point: [/point/i, /interact/i],
  think: [/look_?around/i, /think/i],
};

// Fallbacks keep the character moving when a pack lacks a gesture clip.
const FALLBACKS: Record<Animation, readonly Animation[]> = {
  idle: [],
  talk: ["idle"],
  wave: ["talk", "idle"],
  nod: ["talk", "idle"],
  point: ["talk", "idle"],
  think: ["idle"],
};

const findMatch = (animation: Animation, clipNames: readonly string[]): string | undefined => {
  for (const pattern of CLIP_PATTERNS[animation]) {
    const match = clipNames.find((name) => pattern.test(name));
    if (match) return match;
  }
  return undefined;
};

export const resolveClipName = (animation: Animation, clipNames: readonly string[]): string | undefined => {
  for (const candidate of [animation, ...FALLBACKS[animation]]) {
    const match = findMatch(candidate, clipNames);
    if (match) return match;
  }
  return undefined;
};
