import { describe, expect, it } from "vitest";
import { CATALOG } from "../scene/catalog/catalog";
import { LESSON_SYSTEM_INSTRUCTION, buildLessonPrompt, buildRepairPrompt, lessonJsonSchema } from "./lesson-prompt";

const prompt = () =>
  buildLessonPrompt({
  request: "meeting my new neighbour",
  topic: "meeting a new neighbour",
  intents: ["greet", "say_name"],
  language: "es",
  catalog: CATALOG,
});

describe("buildLessonPrompt", () => {
  it("includes the topic and the target language in English", () => {
    expect(prompt()).toContain("meeting a new neighbour");
    expect(prompt()).toContain("Spanish");
  });

  it("puts the learner's own words first, escaped, even when the summary drifted", () => {
    const drifted = buildLessonPrompt({
      request: "how to exchange money at the <bank>",
      topic: "asking for directions to the bank",
      intents: ["ask_directions"],
      language: "es",
      catalog: CATALOG,
    });
    expect(drifted.split("\n")[0]).toBe("Learner's request: <request>how to exchange money at the &lt;bank&gt;</request>");
    expect(drifted).toMatch(/use only those that suit the request/);
  });

  it("lists the intents to practise", () => {
    expect(prompt()).toContain("greet");
    expect(prompt()).toContain("say_name");
  });

  it("lists every room, character and prop ID from the catalog", () => {
    for (const item of [...CATALOG.rooms, ...CATALOG.characters, ...CATALOG.props]) {
      expect(prompt()).toContain(item.id);
    }
  });

  it("tells the model the learner's speaker ID", () => {
    expect(prompt()).toContain('"learner"');
  });

  it("still works without intents", () => {
    const noIntents = buildLessonPrompt({ request: "at the bakery", topic: "at the bakery", intents: [], language: "es", catalog: CATALOG });
    expect(noIntents).toContain("at the bakery");
    expect(noIntents).not.toContain("undefined");
  });
});

describe("lessonJsonSchema", () => {
  const schema = lessonJsonSchema(CATALOG);

  it("asks for a scenario and a recipe", () => {
    expect(schema.required).toEqual(["scenario", "recipe"]);
  });

  it("limits recipe rooms to catalog IDs", () => {
    expect(schema.properties.recipe).toMatchObject({
      properties: { room: { enum: CATALOG.rooms.map((r) => r.id) } },
    });
  });

  it("describes scenario lines", () => {
    expect(schema.properties.scenario).toMatchObject({ properties: { lines: { type: "array" } } });
  });

  it("makes the decoder write a full lesson", () => {
    expect(schema.properties.scenario).toMatchObject({
      properties: { lines: { minItems: 6 }, goals: { minItems: 2, maxItems: 4 } },
    });
  });
});

describe("buildRepairPrompt", () => {
  it("includes the previous answer and every problem", () => {
    const repair = buildRepairPrompt('{"scenario": {}}', ["scenario.lines: required", "no learner turns"]);
    expect(repair).toContain('{"scenario": {}}');
    expect(repair).toContain("scenario.lines: required");
    expect(repair).toContain("no learner turns");
  });
});

describe("LESSON_SYSTEM_INSTRUCTION", () => {
  it("asks for JSON only", () => {
    expect(LESSON_SYSTEM_INSTRUCTION).toMatch(/JSON/);
  });

  it("tells the writer the request wins over the summary and skills", () => {
    expect(LESSON_SYSTEM_INSTRUCTION).toMatch(/follow the request/);
  });
});
