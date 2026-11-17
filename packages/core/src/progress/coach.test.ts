import { describe, expect, it } from "vitest";
import { CoachNote, validSuggestion } from "./coach";

const lessons = [{ id: "coffee-at-the-cafe", title: "Coffee at the café", level: "A1" }];

describe("CoachNote", () => {
  it("drops a malformed lesson id to null", () => {
    expect(CoachNote.parse({ recap: "Nice week.", tip: "Try speaking mode.", nextLessonId: "Not An Id!" }).nextLessonId).toBeNull();
  });
});

describe("validSuggestion", () => {
  it("returns the lesson only when the coach picked a real one", () => {
    expect(validSuggestion({ recap: "r", tip: "t", nextLessonId: "coffee-at-the-cafe" }, lessons)?.title).toBe("Coffee at the café");
    expect(validSuggestion({ recap: "r", tip: "t", nextLessonId: "made-up" }, lessons)).toBeUndefined();
    expect(validSuggestion({ recap: "r", tip: "t", nextLessonId: null }, lessons)).toBeUndefined();
  });
});
