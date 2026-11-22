import { afterEach, describe, expect, it, vi } from "vitest";
import { START_TIMEOUT_MS, type VoiceLike, pickVoice, rankVoices, speakWithBrowser, voiceTags } from "./browser-voice";

const voice = (lang: string, name: string, localService = true, isDefault = false): VoiceLike => ({ lang, name, localService, default: isDefault });

// What Chrome on macOS lists for Spanish out of the box.
const MAC_SPANISH = [
  voice("es-ES", "Eddy (Spanish (Spain))"),
  voice("es-MX", "Flo (Spanish (Mexico))"),
  voice("es-ES", "Grandma (Spanish (Spain))"),
  voice("es-ES", "Mónica"),
  voice("es-MX", "Paulina"),
  voice("es-ES", "Rocko (Spanish (Spain))"),
];

describe("pickVoice", () => {
  it("skips macOS novelty voices for a standard one", () => {
    expect(pickVoice(MAC_SPANISH, "es")?.name).toBe("Mónica");
    expect(pickVoice(MAC_SPANISH, "es-MX")?.name).toBe("Paulina");
  });

  it("prefers an installed premium or enhanced voice", () => {
    expect(pickVoice([...MAC_SPANISH, voice("es-MX", "Paulina (Premium)")], "es-ES")?.name).toBe("Paulina (Premium)");
  });

  it("prefers on-device voices over network ones of the same quality", () => {
    expect(pickVoice([voice("es-ES", "Google español", false), voice("es-ES", "Mónica")], "es-ES")?.name).toBe("Mónica");
  });

  it("still uses a novelty voice when it's the only one", () => {
    expect(pickVoice([voice("es-ES", "Eddy (Spanish (Spain))")], "es")?.name).toBe("Eddy (Spanish (Spain))");
  });

  it("returns undefined when no voice speaks the language, and accepts underscore locales", () => {
    expect(pickVoice(MAC_SPANISH, "fr")).toBeUndefined();
    expect(pickVoice([voice("es_ES", "Jorge")], "es-ES")?.name).toBe("Jorge");
  });
});

describe("rankVoices and voiceTags", () => {
  it("lists only the language's voices, clearest first, novelty last", () => {
    const ranked = rankVoices([...MAC_SPANISH, voice("en-US", "Samantha"), voice("es-ES", "Google español", false)], "es-ES").map((v) => v.name);
    expect(ranked[0]).toBe("Mónica");
    expect(ranked).not.toContain("Samantha");
    expect(ranked.indexOf("Google español")).toBeLessThan(ranked.indexOf("Eddy (Spanish (Spain))"));
  });

  it("tags premium, online and novelty voices", () => {
    expect(voiceTags(voice("es-MX", "Paulina (Premium)"))).toEqual(["premium"]);
    expect(voiceTags(voice("es-ES", "Google español", false))).toEqual(["online"]);
    expect(voiceTags(voice("es-ES", "Eddy (Spanish (Spain))"))).toEqual(["novelty"]);
  });
});

describe("speakWithBrowser", () => {
  class FakeUtterance {
    lang = "";
    rate = 1;
    voice: unknown = null;
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: ((e: { error: string }) => void) | null = null;
    constructor(readonly text: string) {}
  }

  const fakeEngine = (outcome: (u: FakeUtterance) => "end" | "silent" | string) => {
    const spoken: FakeUtterance[] = [];
    const engine = {
      getVoices: () => [{ name: "Kyoko", lang: "ja-JP", localService: true, default: false }],
      cancel: vi.fn(),
      speak: (u: FakeUtterance) => {
        spoken.push(u);
        const result = outcome(u);
        if (result === "silent") return;
        queueMicrotask(() => {
          if (result !== "end") return u.onerror?.({ error: result });
          u.onstart?.();
          u.onend?.();
        });
      },
    };
    vi.stubGlobal("speechSynthesis", engine);
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
    return spoken;
  };

  afterEach(() => vi.unstubAllGlobals());

  it("retries without the picked voice when it fails, then finishes", async () => {
    const spoken = fakeEngine((u) => (u.voice ? "synthesis-failed" : "end"));
    const done = vi.fn();
    speakWithBrowser("こんにちは", "ja", done);
    await vi.waitFor(() => expect(done).toHaveBeenCalledOnce());
    expect(spoken.map((u) => [u.lang, Boolean(u.voice)])).toEqual([["ja-JP", true], ["ja-JP", false]]);
  });

  it("finishes instead of hanging when no voice can speak", async () => {
    fakeEngine(() => "synthesis-failed");
    const done = vi.fn();
    speakWithBrowser("こんにちは", "ja", done);
    await vi.waitFor(() => expect(done).toHaveBeenCalledOnce());
  });

  it("recovers when Chrome silently drops the utterance", async () => {
    vi.useFakeTimers();
    try {
      const spoken = fakeEngine((u) => (u.voice ? "silent" : "end"));
      const done = vi.fn();
      speakWithBrowser("いらっしゃいませ", "ja", done);
      await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS + 10);
      expect(done).toHaveBeenCalledOnce();
      expect(spoken.map((u) => Boolean(u.voice))).toEqual([true, false]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("finishes after the timeout when nothing ever plays", async () => {
    vi.useFakeTimers();
    try {
      fakeEngine(() => "silent");
      const done = vi.fn();
      speakWithBrowser("hola", "es", done);
      await vi.advanceTimersByTimeAsync(START_TIMEOUT_MS * 2 + 10);
      expect(done).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("stays quiet when stopped", async () => {
    fakeEngine(() => "interrupted");
    const done = vi.fn();
    const stop = speakWithBrowser("hola", "es", done);
    await new Promise((r) => setTimeout(r, 5));
    stop();
    await new Promise((r) => setTimeout(r, 5));
    expect(done).not.toHaveBeenCalled();
  });
});
