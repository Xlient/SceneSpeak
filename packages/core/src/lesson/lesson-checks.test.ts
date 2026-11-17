import { describe, expect, it } from "vitest";
import { COFFEE_AT_THE_CAFE, COFFEE_AT_THE_CAFE_RECIPE } from "./featured/coffee-at-the-cafe";
import { checkLesson } from "./lesson-checks";

const scenario = COFFEE_AT_THE_CAFE;
const recipe = COFFEE_AT_THE_CAFE_RECIPE;

describe("checkLesson", () => {
  it("passes a good lesson", () => {
    expect(checkLesson(scenario, recipe)).toEqual([]);
  });

  it("reports props the scene can't place", () => {
    const crowded = { ...recipe, props: [...recipe.props, { item: "stool", slot: "floor-left" }] };
    expect(checkLesson(scenario, crowded)).toEqual([expect.stringMatching(/^scene: .*stool/)]);
  });

  it("reports a goal with no learner line and a learner line with no goal", () => {
    const lines = scenario.lines.map((l) => (l.expects === "pay" ? { ...l, expects: null } : l));
    expect(checkLesson({ ...scenario, lines }, recipe)).toEqual([
      'goal "pay" is practised by 0 learner lines (expected 1)',
      "every learner line needs an `expects` goal id",
    ]);
  });

  it("reports unknown speakers and duplicate line ids", () => {
    const [first, ...rest] = scenario.lines;
    if (!first) throw new Error("fixture has no lines");
    const lines = [{ ...first, speaker: "pirate" }, ...rest, { ...first, id: "l2" }];
    const problems = checkLesson({ ...scenario, lines }, recipe);
    expect(problems).toContain('line "l1" is spoken by "pirate", who isn\'t in the cast');
    expect(problems).toContain("line ids must be unique");
  });
});
