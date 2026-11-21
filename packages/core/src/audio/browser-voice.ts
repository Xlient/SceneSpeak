import { speechLocale } from "../language/languages";

/** The parts of SpeechSynthesisVoice that voice picking needs. */
export interface VoiceLike {
  lang: string;
  name: string;
  localService: boolean;
  default: boolean;
}

const base = (lang: string) => lang.toLowerCase().split(/[-_]/)[0] ?? "";

// macOS ships these character voices in every language; they're fun but hard to understand.
const NOVELTY = /^(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|fred|kathy)\b/i;
const HIGH_QUALITY = /premium|enhanced|neural|natural/i;

const normalizeLang = (lang: string) => lang.toLowerCase().replace("_", "-");

/** Quality score for a voice in a language, or -Infinity when it doesn't speak it. */
const scoreVoice = (voice: VoiceLike, lang: string): number => {
  const wanted = normalizeLang(speechLocale(lang));
  const voiceLang = normalizeLang(voice.lang);
  if (base(voiceLang) !== base(wanted)) return -Infinity;
  return (
    (HIGH_QUALITY.test(voice.name) ? 8 : 0) +
    (NOVELTY.test(voice.name) ? -10 : 0) +
    (voice.localService ? 3 : 0) +
    (voiceLang === wanted ? 2 : 0) +
    (voice.default ? 1 : 0)
  );
};

/**
 * The language's voices, clearest first. On-device voices beat network ones (device-first),
 * premium/enhanced voices beat standard ones, and novelty voices come last.
 */
export const rankVoices = <V extends VoiceLike>(voices: readonly V[], lang: string): V[] =>
  voices
    .map((voice, index) => ({ voice, index, score: scoreVoice(voice, lang) }))
    .filter((entry) => entry.score > -Infinity)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.voice);

export const pickVoice = <V extends VoiceLike>(voices: readonly V[], lang: string): V | undefined => rankVoices(voices, lang)[0];

export type VoiceTag = "premium" | "online" | "novelty";

export const voiceTags = (voice: VoiceLike): VoiceTag[] => [
  ...(HIGH_QUALITY.test(voice.name) ? (["premium"] as const) : []),
  ...(voice.localService ? [] : (["online"] as const)),
  ...(NOVELTY.test(voice.name) ? (["novelty"] as const) : []),
];

const synth = (): SpeechSynthesis | undefined => (typeof speechSynthesis === "undefined" ? undefined : speechSynthesis);

export const hasBrowserVoice = (lang: string): boolean => {
  const engine = synth();
  return engine !== undefined && pickVoice(engine.getVoices(), lang) !== undefined;
};

/** Voices load asynchronously in Chrome; resolves once the list is known (or after a short wait). */
export const waitForVoices = (timeoutMs = 1500): Promise<void> => {
  const engine = synth();
  if (!engine || engine.getVoices().length > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      engine.removeEventListener("voiceschanged", done);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    engine.addEventListener("voiceschanged", done);
  });
};

const isCancel = (error: string) => error === "interrupted" || error === "canceled";

export const START_TIMEOUT_MS = 2500;

// Chrome stops firing events for utterances it garbage-collects, so keep the live ones referenced.
const inFlight = new Set<SpeechSynthesisUtterance>();

/** Speaks with the browser's built-in voice (not an AI model; nothing leaves the device). Returns a stop function. */
export const speakWithBrowser = (text: string, lang: string, onEnd?: () => void, voiceName?: string): (() => void) => {
  const engine = synth();
  if (!engine) return () => {};
  engine.cancel();
  const voices = engine.getVoices();
  const voice = (voiceName ? voices.find((v) => v.name === voiceName) : undefined) ?? pickVoice(voices, lang);
  let stopped = false;
  let attempt = 0;
  let watchdog: ReturnType<typeof setTimeout> | undefined;

  const say = (withVoice: SpeechSynthesisVoice | undefined) => {
    const mine = ++attempt;
    const current = () => !stopped && mine === attempt;
    // A listed voice can be missing its data, or Chrome can silently drop the utterance: let the engine pick by
    // language instead, and if that fails too, finish rather than leave the lesson waiting.
    const giveUp = () => (withVoice ? say(undefined) : onEnd?.());
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLocale(lang);
    if (withVoice) utterance.voice = withVoice;
    utterance.rate = 0.9;
    const settle = () => {
      clearTimeout(watchdog);
      inFlight.delete(utterance);
    };
    utterance.onstart = () => clearTimeout(watchdog);
    utterance.onend = () => {
      settle();
      if (current()) onEnd?.();
    };
    utterance.onerror = (event) => {
      settle();
      if (current() && !isCancel(event.error)) giveUp();
    };
    clearTimeout(watchdog);
    watchdog = setTimeout(() => {
      if (!current()) return;
      inFlight.delete(utterance);
      engine.cancel();
      giveUp();
    }, START_TIMEOUT_MS);
    inFlight.add(utterance);
    engine.speak(utterance);
  };

  // Chrome can drop an utterance queued in the same task as cancel().
  setTimeout(() => {
    if (!stopped) say(voice);
  }, 0);
  return () => {
    stopped = true;
    clearTimeout(watchdog);
    engine.cancel();
  };
};
