import { describe, expect, it } from "vitest";
import { COFFEE_AT_THE_CAFE, COFFEE_AT_THE_CAFE_RECIPE } from "../featured/coffee-at-the-cafe";
import type { LoadedCommunityLesson } from "./community-lesson";
import { contributors } from "./contributors";

const lesson = (authors: string[], language = "es"): LoadedCommunityLesson => ({
  scenario: { ...COFFEE_AT_THE_CAFE, language },
  recipe: COFFEE_AT_THE_CAFE_RECIPE,
  blurb: "b",
  emoji: "☕",
  authors,
  path: authors.join("-"),
});

describe("contributors", () => {
  it("counts lessons and languages per person, most active first", () => {
    expect(contributors([lesson(["ana"]), lesson(["Bo", "ana"], "fr"), lesson(["bo"])])).toEqual([
      { username: "ana", lessons: 2, languages: ["es", "fr"] },
      { username: "Bo", lessons: 2, languages: ["es", "fr"] },
    ]);
  });

  it("counts a person once per lesson even if listed twice", () => {
    expect(contributors([lesson(["ana", "Ana"])])[0]?.lessons).toBe(1);
  });
});
