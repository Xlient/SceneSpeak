import { describe, expect, it } from "vitest";
import { CATALOG } from "../catalog/catalog";
import { MAX_RECIPE_PROPS, SceneRecipe, sceneRecipeJsonSchema } from "./scene-recipe";

describe("SceneRecipe", () => {
  it("parses a valid recipe", () => {
    const recipe = { room: "bakery", character: "baker", props: [{ item: "counter", slot: "counter" }], poses: [{ lineId: "l1", animation: "wave" }] };
    expect(SceneRecipe.parse(recipe)).toEqual(recipe);
  });

  it("drops malformed props and poses instead of failing", () => {
    const parsed = SceneRecipe.parse({
      room: "bakery",
      character: "baker",
      props: [{ item: "counter", slot: "counter" }, { item: "Counter!!", slot: "counter" }, { item: "jar", slot: "ceiling" }, "nope"],
      poses: [{ lineId: "l1", animation: "dance" }, { lineId: "l2", animation: "nod" }],
    });
    expect(parsed.props).toEqual([{ item: "counter", slot: "counter" }]);
    expect(parsed.poses).toEqual([{ lineId: "l2", animation: "nod" }]);
  });

  it("defaults missing lists and caps props", () => {
    expect(SceneRecipe.parse({ room: "bakery", character: "baker" })).toMatchObject({ props: [], poses: [] });
    const many = Array.from({ length: 20 }, () => ({ item: "jar", slot: "counter-top" }));
    expect(SceneRecipe.parse({ room: "bakery", character: "baker", props: many }).props).toHaveLength(MAX_RECIPE_PROPS);
  });

  it("rejects a recipe with no room", () => {
    expect(SceneRecipe.safeParse({ character: "baker" }).success).toBe(false);
  });
});

describe("sceneRecipeJsonSchema", () => {
  it("lists catalog IDs as enums", () => {
    const schema = JSON.stringify(sceneRecipeJsonSchema(CATALOG));
    for (const id of ["bakery", "baker", "bread-roll", "counter-top"]) expect(schema).toContain(`"${id}"`);
  });
});
