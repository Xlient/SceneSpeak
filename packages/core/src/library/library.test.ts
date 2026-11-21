import { describe, expect, it } from "vitest";
import { goodLesson } from "../ai/lesson-fixtures";
import { MAX_LESSON_CHARS, parseLibraryLesson, rankLibrary, toPublishDoc } from "./library";

const row = (overrides: Record<string, unknown> = {}) => ({
  id: "a",
  title: "Hotel check-in",
  topic: "checking in at a hotel",
  language: "es",
  level: "A1",
  intents: ["greet", "juggle"],
  authorUid: "u1",
  authorName: "Sam",
  votes: 3,
  hidden: false,
  ...overrides,
});

describe("rankLibrary", () => {
  it("keeps visible rows in the language, most upvoted first", () => {
    const rows = [row({ id: "low", votes: 1 }), row({ id: "top", votes: 9 }), row({ id: "fr", language: "fr" }), row({ id: "hid", hidden: true })];
    expect(rankLibrary(rows, "es").map((e) => e.id)).toEqual(["top", "low"]);
  });

  it("drops broken rows and unknown intents", () => {
    const ranked = rankLibrary([row(), { id: "x" }, null], "es");
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.intents).toEqual(["greet"]);
  });

  it("treats a missing hidden flag as hidden", () => {
    expect(rankLibrary([row({ hidden: undefined })], "es")).toEqual([]);
  });
});

describe("toPublishDoc and parseLibraryLesson", () => {
  const input = { lesson: goodLesson, topic: "meeting a new neighbour", intents: ["greet" as const], authorUid: "u1", authorDisplayName: "Sam Rivera" };

  it("publishes first name only and round-trips the lesson", () => {
    const doc = toPublishDoc(input);
    expect(doc).toMatchObject({ title: goodLesson.scenario.title, language: "es", authorName: "Sam", intents: ["greet"] });
    expect(parseLibraryLesson(doc.lesson).scenario.id).toBe(goodLesson.scenario.id);
  });

  it("refuses lessons that are too big", () => {
    const huge = { ...goodLesson, scenario: { ...goodLesson.scenario, description: "x".repeat(MAX_LESSON_CHARS) } };
    expect(() => toPublishDoc({ ...input, lesson: huge })).toThrow(/too long/);
  });

  it("rejects stored lessons that aren't valid", () => {
    expect(() => parseLibraryLesson('{"scenario":{}}')).toThrow();
    expect(() => parseLibraryLesson("not json")).toThrow();
  });
});

describe("rankLibrary across languages", () => {
  it("lists every language when the filter is null", () => {
    const rows = [row({ id: "es" }), row({ id: "ja", language: "ja", votes: 9 })];
    expect(rankLibrary(rows, null).map((e) => e.id)).toEqual(["ja", "es"]);
    expect(rankLibrary(rows, "ja").map((e) => e.id)).toEqual(["ja"]);
  });
});
