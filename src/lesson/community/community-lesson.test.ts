import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadCommunityLessons } from "./community-lesson";

const market: unknown = JSON.parse(readFileSync(new URL("../../../lessons/es/buying-fruit-at-the-market.json", import.meta.url), "utf8"));

describe("loadCommunityLessons", () => {
  it("keeps valid lessons sorted by path and skips broken ones", () => {
    const lessons = loadCommunityLessons({ "/lessons/zz/broken.json": { scenario: {} }, "/lessons/es/market.json": market });
    expect(lessons.map((l) => l.path)).toEqual(["/lessons/es/market.json"]);
    expect(lessons[0]?.authors).toEqual(["Xlient"]);
  });
});
