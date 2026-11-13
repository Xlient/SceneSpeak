import { describe, expect, it } from "vitest";
import { ORDERING_AT_THE_BAKERY } from "../../lesson/featured/ordering-at-the-bakery";
import { CATALOG } from "../catalog/catalog";
import { applyPoses, parseSceneRecipe, resolveRecipe } from "./resolve-recipe";

describe("resolveRecipe", () => {
  it("resolves known IDs with no issues", () => {
    const { resolved, issues } = resolveRecipe(
      { room: "bakery", character: "baker", props: [{ item: "counter", slot: "counter" }], poses: [] },
      CATALOG,
    );
    expect(issues).toEqual([]);
    expect(resolved.room.id).toBe("bakery");
    expect(resolved.character.id).toBe("baker");
    expect(resolved.props.map((p) => p.item.id)).toEqual(["counter"]);
  });

  it("falls back for an unknown room and character", () => {
    const { resolved, issues } = resolveRecipe({ room: "moon-base", character: "astronaut", props: [], poses: [] }, CATALOG);
    expect(resolved.room.id).toBe(CATALOG.fallbackRoomId);
    expect(resolved.character.id).toBe(CATALOG.fallbackCharacterId);
    expect(issues.map((i) => i.code)).toEqual(["unknown-room", "unknown-character"]);
  });

  it("drops unknown props and props in slots they don't fit", () => {
    const { resolved, issues } = resolveRecipe(
      {
        room: "bakery",
        character: "baker",
        props: [
          { item: "spaceship", slot: "back" },
          { item: "oven", slot: "counter-top" },
          { item: "jar", slot: "counter-top" },
        ],
        poses: [],
      },
      CATALOG,
    );
    expect(resolved.props.map((p) => p.item.id)).toEqual(["jar"]);
    expect(issues.map((i) => i.code)).toEqual(["unknown-prop", "prop-does-not-fit-slot"]);
  });

  it("drops poses for lines the scenario doesn't have", () => {
    const { resolved, issues } = resolveRecipe(
      { room: "bakery", character: "baker", props: [], poses: [{ lineId: "l1", animation: "nod" }, { lineId: "l99", animation: "wave" }] },
      CATALOG,
      ORDERING_AT_THE_BAKERY,
    );
    expect([...resolved.poses]).toEqual([["l1", "nod"]]);
    expect(issues.map((i) => i.code)).toEqual(["unknown-line"]);
  });
});

describe("parseSceneRecipe", () => {
  it("reports a shape error for non-recipes", () => {
    expect(parseSceneRecipe("a bakery please", CATALOG).ok).toBe(false);
  });

  it("parses and resolves raw model output", () => {
    const result = parseSceneRecipe({ room: "bakery", character: "baker", props: [{ item: "jar", slot: "counter-top" }] }, CATALOG);
    expect(result.ok && result.resolved.props).toHaveLength(1);
  });
});

describe("applyPoses", () => {
  it("overrides only the posed lines", () => {
    const posed = applyPoses(ORDERING_AT_THE_BAKERY, new Map([["l3", "think" as const]]));
    expect(posed.lines.find((l) => l.id === "l3")?.animation).toBe("think");
    expect(posed.lines.find((l) => l.id === "l1")?.animation).toBe("wave");
  });
});
