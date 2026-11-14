import { MEET_THE_NEIGHBOUR } from "../lesson/featured/meet-the-neighbour";
import type { Line, Scenario } from "../schemas";

export const scenario: Scenario = MEET_THE_NEIGHBOUR;

export const lineById = (id: string, from: Scenario = scenario): Line => {
  const line = from.lines.find((l) => l.id === id);
  if (!line) throw new Error(`No line ${id} in ${from.id}`);
  return line;
};

/** l4: Mateo asks your name; expected answer "Me llamo Alex." (goal say-name). */
export const askName = lineById("l4");

export const goodGradeJson = JSON.stringify({
  ok: true,
  meaningMatches: true,
  score: 90,
  correction: null,
  hint: "Nice! You could also say 'Soy Sam'.",
  goalId: "say-name",
  errorType: "none",
});
