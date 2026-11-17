import { MEET_THE_NEIGHBOUR, MEET_THE_NEIGHBOUR_RECIPE } from "../lesson/featured/meet-the-neighbour";

/** A lesson the cloud model might write: a valid scenario plus a recipe that uses catalog IDs. */
export const goodLesson = { scenario: MEET_THE_NEIGHBOUR, recipe: MEET_THE_NEIGHBOUR_RECIPE };

export const goodLessonJson = JSON.stringify(goodLesson);

export const lessonJsonWith = (patch: { scenario?: Record<string, unknown>; recipe?: Record<string, unknown> }) =>
  JSON.stringify({
    scenario: { ...goodLesson.scenario, ...patch.scenario },
    recipe: { ...goodLesson.recipe, ...patch.recipe },
  });

export const safeScreenJson = JSON.stringify({
  safe: true,
  reason: null,
  topic: "meeting a new neighbour",
  intents: ["greet", "say_name", "say_origin", "say_goodbye"],
});
