import type { Animation, Scenario } from "../../schemas";
import { fallbackCharacter, fallbackRoom, findCharacter, findProp, findRoom } from "../catalog/catalog";
import type { Catalog, CharacterItem, PropItem, RoomItem, SlotKind } from "../catalog/catalog-types";
import { SceneRecipe } from "./scene-recipe";

export type RecipeIssueCode =
  | "unknown-room"
  | "unknown-character"
  | "unknown-prop"
  | "slot-not-in-room"
  | "prop-does-not-fit-slot"
  | "unknown-line"
  | "no-space"
  | "no-surface";

export interface RecipeIssue {
  code: RecipeIssueCode;
  detail: string;
}

export interface ResolvedProp {
  item: PropItem;
  slot: SlotKind;
}

export interface ResolvedRecipe {
  room: RoomItem;
  character: CharacterItem;
  props: readonly ResolvedProp[];
  poses: ReadonlyMap<string, Animation>;
}

export interface RecipeResolution {
  resolved: ResolvedRecipe;
  issues: readonly RecipeIssue[];
}

/** Maps catalog IDs to items. Unknown IDs fall back or get dropped, each with an issue the generator can repair. */
export const resolveRecipe = (recipe: SceneRecipe, catalog: Catalog, scenario?: Scenario): RecipeResolution => {
  const issues: RecipeIssue[] = [];

  let room = findRoom(catalog, recipe.room);
  if (!room) {
    room = fallbackRoom(catalog);
    issues.push({ code: "unknown-room", detail: `"${recipe.room}" isn't in the catalog; using "${room.id}".` });
  }

  let character = findCharacter(catalog, recipe.character);
  if (!character) {
    character = fallbackCharacter(catalog);
    issues.push({ code: "unknown-character", detail: `"${recipe.character}" isn't in the catalog; using "${character.id}".` });
  }

  const roomSlots = new Set(room.slots.map((s) => s.kind));
  const props: ResolvedProp[] = [];
  for (const { item: id, slot } of recipe.props) {
    const item = findProp(catalog, id);
    if (!item) issues.push({ code: "unknown-prop", detail: `"${id}" isn't in the catalog.` });
    else if (!roomSlots.has(slot)) issues.push({ code: "slot-not-in-room", detail: `"${room.id}" has no "${slot}" slot.` });
    else if (!item.fits.includes(slot)) issues.push({ code: "prop-does-not-fit-slot", detail: `"${id}" can't go in "${slot}".` });
    else props.push({ item, slot });
  }

  const lineIds = scenario ? new Set(scenario.lines.map((l) => l.id)) : undefined;
  const poses = new Map<string, Animation>();
  for (const { lineId, animation } of recipe.poses) {
    if (lineIds && !lineIds.has(lineId)) issues.push({ code: "unknown-line", detail: `No line "${lineId}" to pose.` });
    else poses.set(lineId, animation);
  }

  return { resolved: { room, character, props, poses }, issues };
};

export type RecipeParseResult =
  | { ok: true; resolved: ResolvedRecipe; issues: readonly RecipeIssue[] }
  | { ok: false; error: string };

/** Entry point for raw model output: shape check with Zod, then catalog check. */
export const parseSceneRecipe = (raw: unknown, catalog: Catalog, scenario?: Scenario): RecipeParseResult => {
  const parsed = SceneRecipe.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.message };
  return { ok: true, ...resolveRecipe(parsed.data, catalog, scenario) };
};

/** Recipe poses override each line's animation. */
export const applyPoses = (scenario: Scenario, poses: ReadonlyMap<string, Animation>): Scenario => ({
  ...scenario,
  lines: scenario.lines.map((line) => {
    const animation = poses.get(line.id);
    return animation ? { ...line, animation } : line;
  }),
});
