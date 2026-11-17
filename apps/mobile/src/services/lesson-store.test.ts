import { describe, expect, it } from "vitest";
import { goodLesson } from "@scenespeak/core/ai/lesson-fixtures";
import { FEATURED_LESSONS } from "@scenespeak/core/lesson/featured/featured-lessons";
import { buildPlayableLesson } from "@scenespeak/core/lesson/playable-lesson";
import { findLesson, rememberLesson } from "./lesson-store";

describe("lesson store", () => {
  it("finds featured lessons by id", () => {
    const id = FEATURED_LESSONS[0]?.scenario.id ?? "";
    expect(findLesson(id)?.scenario.id).toBe(id);
  });

  it("finds a remembered generated lesson", () => {
    const lesson = buildPlayableLesson({ ...goodLesson.scenario, id: "generated-test" }, goodLesson.recipe);
    expect(findLesson(rememberLesson(lesson))).toBe(lesson);
    expect(findLesson("missing")).toBeUndefined();
  });
});
