import type { Catalog } from "../scene/catalog/catalog-types";
import { LEARNER_SPEAKER, type Scenario } from "../schemas";
import { buildPlayableLesson } from "./playable-lesson";

/** Problems that would make a hand-written lesson play badly; empty when it's good to ship. */
export const checkLesson = (scenario: Scenario, recipe: unknown, catalog?: Catalog): string[] => {
  const problems: string[] = [];

  for (const issue of buildPlayableLesson(scenario, recipe, catalog).issues) problems.push(`scene: ${issue.detail}`);

  const learnerGoals = scenario.lines.filter((l) => l.speaker === LEARNER_SPEAKER).map((l) => l.expects);
  for (const goal of scenario.goals) {
    const count = learnerGoals.filter((id) => id === goal.id).length;
    if (count !== 1) problems.push(`goal "${goal.id}" is practised by ${count} learner lines (expected 1)`);
  }
  if (learnerGoals.includes(null)) problems.push("every learner line needs an `expects` goal id");

  const speakers = new Set([LEARNER_SPEAKER, ...scenario.cast.map((c) => c.characterId)]);
  for (const line of scenario.lines) {
    if (!speakers.has(line.speaker)) problems.push(`line "${line.id}" is spoken by "${line.speaker}", who isn't in the cast`);
  }

  const lineIds = scenario.lines.map((l) => l.id);
  if (new Set(lineIds).size !== lineIds.length) problems.push("line ids must be unique");

  return problems;
};
