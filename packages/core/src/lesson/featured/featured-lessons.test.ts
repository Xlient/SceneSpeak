import { describe, expect, it } from "vitest";
import { checkLesson } from "../lesson-checks";
import { FEATURED_LESSONS } from "./featured-lessons";

describe("featured lessons", () => {
  it.each(FEATURED_LESSONS.map((f) => [f.scenario.id, f] as const))("%s passes the lesson checks", (_id, featured) => {
    expect(checkLesson(featured.scenario, featured.recipe)).toEqual([]);
  });

  it("casts each recipe's character", () => {
    for (const { scenario, recipe } of FEATURED_LESSONS) {
      expect(scenario.cast.map((c) => c.characterId)).toContain(recipe.character);
    }
  });
});
