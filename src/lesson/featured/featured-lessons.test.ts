import { describe, expect, it } from "vitest";
import { LEARNER_SPEAKER } from "../../schemas";
import { buildPlayableLesson } from "../playable-lesson";
import { FEATURED_LESSONS } from "./featured-lessons";

describe.each(FEATURED_LESSONS.map((f) => [f.scenario.id, f] as const))("featured lesson %s", (_id, featured) => {
  const { scenario, recipe } = featured;

  it("builds its scene with nothing dropped or replaced", () => {
    expect(buildPlayableLesson(scenario, recipe).issues).toEqual([]);
  });

  it("has every goal practised by exactly one learner line", () => {
    const expected = scenario.lines.filter((l) => l.speaker === LEARNER_SPEAKER).map((l) => l.expects);
    expect(expected.toSorted()).toEqual(scenario.goals.map((g) => g.id).toSorted());
  });

  it("only uses cast members as speakers", () => {
    const speakers = new Set([LEARNER_SPEAKER, ...scenario.cast.map((c) => c.characterId)]);
    expect(scenario.lines.every((l) => speakers.has(l.speaker))).toBe(true);
  });

  it("casts the recipe's character", () => {
    expect(scenario.cast.map((c) => c.characterId)).toContain(recipe.character);
  });
});
