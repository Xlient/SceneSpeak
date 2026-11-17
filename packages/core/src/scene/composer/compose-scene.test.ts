import { describe, expect, it } from "vitest";
import { FEATURED_LESSONS } from "../../lesson/featured/featured-lessons";
import { CATALOG } from "../catalog/catalog";
import { type ResolvedRecipe, resolveRecipe } from "../recipe/resolve-recipe";
import type { SceneRecipe } from "../recipe/scene-recipe";
import type { PropPlacement } from "../scene-manifest";
import { composeScene, layoutRow } from "./compose-scene";

const resolve = (recipe: SceneRecipe): ResolvedRecipe => resolveRecipe(recipe, CATALOG).resolved;

const sizeOf = (placement: PropPlacement) => {
  const item = CATALOG.props.find((p) => p.id === placement.id);
  if (!item) throw new Error(placement.id);
  return item.size;
};

const boxesOverlap = (a: PropPlacement, b: PropPlacement) => {
  const [aw, ah, ad] = sizeOf(a);
  const [bw, bh, bd] = sizeOf(b);
  const apart = (p: number, q: number, half: number) => Math.abs(p - q) >= half - 1e-9;
  return !(
    apart(a.position[0], b.position[0], (aw + bw) / 2) ||
    apart(a.position[2], b.position[2], (ad + bd) / 2) ||
    a.position[1] >= b.position[1] + bh - 1e-9 ||
    b.position[1] >= a.position[1] + ah - 1e-9
  );
};

describe("layoutRow", () => {
  it("centers a row in one segment", () => {
    const { xs } = layoutRow([{ width: 1, depth: 0.5 }], [{ from: -2, to: 2 }], 1);
    expect(xs).toEqual([0]);
  });

  it("drops items that are too wide or too deep", () => {
    const { xs } = layoutRow(
      [
        { width: 3, depth: 0.5 },
        { width: 0.5, depth: 2 },
        { width: 1, depth: 0.5 },
      ],
      [{ from: -1, to: 1 }],
      1,
    );
    expect(xs).toEqual([null, null, 0]);
  });

  it("balances items across a kept-clear middle", () => {
    const { xs } = layoutRow(
      [
        { width: 0.4, depth: 0.2 },
        { width: 0.4, depth: 0.2 },
      ],
      [
        { from: -1, to: -0.25 },
        { from: 0.25, to: 1 },
      ],
      1,
    );
    const [left, right] = xs;
    expect(left).toBeLessThan(-0.25);
    expect(right).toBeGreaterThan(0.25);
  });
});

describe("composeScene", () => {
  it("places counter-top items on the counter's surface", () => {
    const { manifest, issues } = composeScene(
      resolve({ room: "bakery", character: "baker", props: [{ item: "counter", slot: "counter" }, { item: "jar", slot: "counter-top" }], poses: [] }),
      { id: "t" },
    );
    expect(issues).toEqual([]);
    const counter = CATALOG.props.find((p) => p.id === "counter");
    expect(manifest.props.find((p) => p.id === "jar")?.position[1]).toBeCloseTo(counter?.surface ?? -1);
  });

  it("drops counter-top items when nothing is there to hold them", () => {
    const { manifest, issues } = composeScene(
      resolve({ room: "bakery", character: "baker", props: [{ item: "jar", slot: "counter-top" }], poses: [] }),
      { id: "t" },
    );
    expect(manifest.props).toEqual([]);
    expect(issues.map((i) => i.code)).toEqual(["no-surface"]);
  });

  it("drops what doesn't fit and reports it", () => {
    const ovens = Array.from({ length: 5 }, () => ({ item: "oven", slot: "back" as const }));
    const { manifest, issues } = composeScene(resolve({ room: "bakery", character: "baker", props: ovens, poses: [] }), { id: "t" });
    expect(manifest.props.length).toBe(3);
    expect(issues.filter((i) => i.code === "no-space")).toHaveLength(2);
  });

  it("keeps the middle of the counter clear for the character", () => {
    const { manifest } = composeScene(
      resolve({
        room: "bakery",
        character: "baker",
        props: [{ item: "counter", slot: "counter" }, { item: "counter", slot: "counter" }, { item: "jar", slot: "counter-top" }, { item: "jar", slot: "counter-top" }],
        poses: [],
      }),
      { id: "t" },
    );
    for (const jar of manifest.props.filter((p) => p.id === "jar")) expect(Math.abs(jar.position[0])).toBeGreaterThan(0.25);
  });

  it.each(FEATURED_LESSONS.map((l) => [l.scenario.id, l.recipe] as const))("lays out %s without overlaps", (_, recipe) => {
    const { manifest, issues } = composeScene(resolve(recipe), { id: "t" });
    expect(issues).toEqual([]);
    manifest.props.forEach((a, i) => {
      for (const b of manifest.props.slice(i + 1)) expect(boxesOverlap(a, b), `${a.id} vs ${b.id}`).toBe(false);
    });
  });

  it("uses the character's look, and its model when there is one", () => {
    const { manifest } = composeScene(resolve({ room: "wood-workshop", character: "carpenter", props: [], poses: [] }), { id: "t" });
    expect(manifest.character.model?.url).toContain("worker");
    expect(manifest.room).toBe("workshop");
  });
});
