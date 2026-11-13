import { CATALOG } from "../scene/catalog/catalog";
import type { Catalog } from "../scene/catalog/catalog-types";
import { composeScene } from "../scene/composer/compose-scene";
import { type RecipeIssue, applyPoses, parseSceneRecipe, resolveRecipe } from "../scene/recipe/resolve-recipe";
import type { SceneRecipe } from "../scene/recipe/scene-recipe";
import type { SceneManifest } from "../scene/scene-manifest";
import type { Scenario } from "../schemas";

export interface PlayableLesson {
  scenario: Scenario;
  manifest: SceneManifest;
  /** Present for generated lessons: painted backdrop (gradient until it's ready). */
  backdrop?: { url?: string | undefined };
  issues: readonly RecipeIssue[];
}

export const fallbackRecipe = (catalog: Catalog): SceneRecipe => ({
  room: catalog.fallbackRoomId,
  character: catalog.fallbackCharacterId,
  props: [
    { item: "counter", slot: "counter" },
    { item: "counter", slot: "counter" },
    { item: "menu", slot: "counter-top" },
    { item: "jar", slot: "counter-top" },
  ],
  poses: [],
});

/** Scenario + raw recipe → something the lesson screen can play. A recipe that fails to parse gets the fallback room. */
export const buildPlayableLesson = (scenario: Scenario, rawRecipe: unknown, catalog: Catalog = CATALOG): PlayableLesson => {
  const parsed = parseSceneRecipe(rawRecipe, catalog, scenario);
  const resolution = parsed.ok
    ? parsed
    : {
        ...resolveRecipe(fallbackRecipe(catalog), catalog, scenario),
        issues: [{ code: "unknown-room" as const, detail: `Recipe didn't parse; using the fallback room. ${parsed.error}` }],
      };
  const composed = composeScene(resolution.resolved, { id: scenario.id });
  return {
    scenario: applyPoses(scenario, resolution.resolved.poses),
    manifest: composed.manifest,
    issues: [...resolution.issues, ...composed.issues],
  };
};
