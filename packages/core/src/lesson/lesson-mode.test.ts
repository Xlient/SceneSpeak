import { describe, expect, it } from "vitest";
import { LESSON_MODES, MODE_SETTINGS, isLessonMode } from "./lesson-mode";

describe("lesson modes", () => {
  it("makes speaking voice-first, hands-free and English-off", () => {
    expect(MODE_SETTINGS.speaking).toMatchObject({ voiceFirst: true, autoAdvance: true, showTranslation: false, autoPlay: true });
  });

  it("keeps typing mode text-first with English shown", () => {
    expect(MODE_SETTINGS.typing).toMatchObject({ voiceFirst: false, autoAdvance: false, showTranslation: true });
  });

  it("recognises only known modes", () => {
    expect(LESSON_MODES.every(isLessonMode)).toBe(true);
    expect(isLessonMode("singing")).toBe(false);
    expect(isLessonMode(undefined)).toBe(false);
  });
});
