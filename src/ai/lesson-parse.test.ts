import { describe, expect, it } from "vitest";
import { CATALOG } from "../scene/catalog/catalog";
import { goodLesson, goodLessonJson, lessonJsonWith } from "./lesson-fixtures";
import { LessonParseError, parseLesson, parseModelJson } from "./lesson-parse";

const options = { catalog: CATALOG, language: "es" };

const problemsOf = (raw: string): readonly string[] => {
  try {
    parseLesson(raw, options);
  } catch (error) {
    if (error instanceof LessonParseError) return error.problems;
    throw error;
  }
  throw new Error("expected a LessonParseError");
};

describe("parseModelJson", () => {
  it("parses JSON, with or without ``` fences", () => {
    expect(parseModelJson('{"a":1}')).toEqual({ a: 1 });
    expect(parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseModelJson('```\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("throws LessonParseError that keeps the raw text", () => {
    try {
      parseModelJson("nope");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(LessonParseError);
      expect((error as LessonParseError).raw).toBe("nope");
      expect((error as LessonParseError).problems.length).toBeGreaterThan(0);
    }
  });
});

describe("parseLesson", () => {
  it("returns the scenario and recipe for a valid lesson", () => {
    const { lesson, issues } = parseLesson(goodLessonJson, options);
    expect(lesson.scenario.title).toBe(goodLesson.scenario.title);
    expect(lesson.recipe.room).toBe("wood-workshop");
    expect(issues).toEqual([]);
  });

  it("sets the language to the one the learner asked for", () => {
    const { lesson } = parseLesson(lessonJsonWith({ scenario: { language: "fr" } }), options);
    expect(lesson.scenario.language).toBe("es");
  });

  it("reports scenario shape problems", () => {
    const problems = problemsOf(lessonJsonWith({ scenario: { lines: [] } }));
    expect(problems.join("\n")).toMatch(/lines/);
  });

  it("rejects a lesson where the learner never speaks", () => {
    const npcOnly = goodLesson.scenario.lines.filter((l) => l.speaker !== "learner");
    expect(problemsOf(lessonJsonWith({ scenario: { lines: npcOnly } })).join("\n")).toMatch(/learner/);
  });

  it("rejects lines spoken by someone who isn't in the cast", () => {
    const lines = goodLesson.scenario.lines.map((l, i) => (i === 0 ? { ...l, speaker: "pirate" } : l));
    expect(problemsOf(lessonJsonWith({ scenario: { lines } })).join("\n")).toMatch(/pirate/);
  });

  it("reports a recipe that isn't the right shape", () => {
    expect(problemsOf(lessonJsonWith({ recipe: { room: 42 } })).join("\n")).toMatch(/recipe/);
  });

  it("keeps a lesson with unknown catalog IDs but lists them as issues", () => {
    const { issues } = parseLesson(lessonJsonWith({ recipe: { room: "space-station" } }), options);
    expect(issues.map((i) => i.code)).toContain("unknown-room");
  });

  it("rejects JSON without a scenario or recipe", () => {
    expect(problemsOf(JSON.stringify({ title: "Hi" })).length).toBeGreaterThan(0);
  });
});
