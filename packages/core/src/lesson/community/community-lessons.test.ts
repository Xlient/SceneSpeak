import { readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { checkLesson } from "../lesson-checks";
import { CommunityLesson } from "./community-lesson";

const RawCounts = z.object({
  scenario: z.object({ lines: z.array(z.unknown()), goals: z.array(z.unknown()) }),
  recipe: z.object({ props: z.array(z.unknown()) }),
});

// Every contributed lesson must pass these before a mod can merge it (CI runs them on each PR).
const root = join(dirname(fileURLToPath(import.meta.url)), "../../../lessons");
const files = readdirSync(root, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".json"))
  .map((file) => join(root, file));

describe("community lessons", () => {
  it("finds lesson files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  describe.each(files.map((file) => [relative(root, file), file] as const))("%s", (_name, file) => {
    const raw: unknown = JSON.parse(readFileSync(file, "utf8"));
    const parsed = CommunityLesson.safeParse(raw);

    it("matches the lesson format", () => {
      expect(parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)).toEqual([]);
    });

    if (!parsed.success) return;
    const { scenario, recipe } = parsed.data;

    it("lives at lessons/<language>/<id>.json", () => {
      expect(relative(root, file)).toBe(join(scenario.language, `${scenario.id}.json`));
    });

    it("passes the lesson checks", () => {
      expect(checkLesson(scenario, recipe)).toEqual([]);
    });

    it("casts the recipe's character", () => {
      expect(scenario.cast.map((c) => c.characterId)).toContain(recipe.character);
    });

    it("has no fields the app would silently drop", () => {
      // The schema drops bad entries; compare counts so contributors see them instead.
      const input = RawCounts.parse(raw);
      expect(scenario.lines).toHaveLength(input.scenario.lines.length);
      expect(scenario.goals).toHaveLength(input.scenario.goals.length);
      expect(recipe.props).toHaveLength(input.recipe.props.length);
      expect(basename(file)).toMatch(/^[a-z0-9-]+\.json$/);
    });
  });
});
