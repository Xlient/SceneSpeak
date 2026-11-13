import { describe, expect, it } from "vitest";
import { CATALOG } from "../scene/catalog/catalog";
import { ORDERING_AT_THE_BAKERY, ORDERING_AT_THE_BAKERY_RECIPE } from "./featured/ordering-at-the-bakery";
import { buildPlayableLesson } from "./playable-lesson";

describe("buildPlayableLesson", () => {
  it("builds the bakery scene from its recipe", () => {
    const lesson = buildPlayableLesson(ORDERING_AT_THE_BAKERY, ORDERING_AT_THE_BAKERY_RECIPE);
    expect(lesson.issues).toEqual([]);
    expect(lesson.manifest.room).toBe("bakery");
    expect(lesson.manifest.props.filter((p) => p.id === "bread-roll")).toHaveLength(2);
  });

  it("uses the fallback room when the recipe is garbage", () => {
    const lesson = buildPlayableLesson(ORDERING_AT_THE_BAKERY, "not a recipe");
    expect(lesson.manifest.room).toBe(CATALOG.rooms.find((r) => r.id === CATALOG.fallbackRoomId)?.style);
    expect(lesson.manifest.props.length).toBeGreaterThan(0);
    expect(lesson.issues[0]?.code).toBe("unknown-room");
  });

  it("applies recipe poses to the scenario", () => {
    const lesson = buildPlayableLesson(ORDERING_AT_THE_BAKERY, { ...ORDERING_AT_THE_BAKERY_RECIPE, poses: [{ lineId: "l7", animation: "think" }] });
    expect(lesson.scenario.lines.find((l) => l.id === "l7")?.animation).toBe("think");
  });
});
