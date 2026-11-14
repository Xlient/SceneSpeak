import { describe, expect, it } from "vitest";
import { type VoiceLike, pickVoice, rankVoices, voiceTags } from "./browser-voice";

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
