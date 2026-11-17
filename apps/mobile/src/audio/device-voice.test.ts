import { describe, expect, it } from "vitest";
import { pickPhoneVoice } from "./device-voice";

const voice = (identifier: string, language: string, quality = "Default") => ({ identifier, name: identifier, language, quality });

describe("pickPhoneVoice", () => {
  it("prefers an enhanced voice in the lesson language", () => {
    const voices = [voice("en-1", "en-US"), voice("es-basic", "es-ES"), voice("es-nice", "es-ES", "Enhanced")];
    expect(pickPhoneVoice(voices, "es")).toBe("es-nice");
  });

  it("returns undefined when the phone has no voice for the language", () => {
    expect(pickPhoneVoice([voice("en-1", "en-US")], "zh")).toBeUndefined();
  });

  it("accepts Android's underscore language codes", () => {
    expect(pickPhoneVoice([voice("es-x", "es_ES")], "es")).toBe("es-x");
  });
});
