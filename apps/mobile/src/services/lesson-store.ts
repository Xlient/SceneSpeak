import { FEATURED_LESSONS } from "@scenespeak/core/lesson/featured/featured-lessons";
import { type PlayableLesson, buildPlayableLesson } from "@scenespeak/core/lesson/playable-lesson";
import { COMMUNITY_LESSONS } from "../lessons/community";

// Generated and library lessons live in memory for this app session; routes only carry the id.
const extra = new Map<string, PlayableLesson>();

export const rememberLesson = (lesson: PlayableLesson): string => {
  extra.set(lesson.scenario.id, lesson);
  return lesson.scenario.id;
};

export const findLesson = (id: string): PlayableLesson | undefined => {
  const bundled = [...FEATURED_LESSONS, ...COMMUNITY_LESSONS].find((lesson) => lesson.scenario.id === id);
  return bundled ? buildPlayableLesson(bundled.scenario, bundled.recipe) : extra.get(id);
};
