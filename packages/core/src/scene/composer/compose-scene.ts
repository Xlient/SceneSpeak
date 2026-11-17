import type { SlotDef, SlotKind } from "../catalog/catalog-types";
import type { RecipeIssue, ResolvedProp, ResolvedRecipe } from "../recipe/resolve-recipe";
import type { PropPlacement, SceneManifest, Vec3 } from "../scene-manifest";
import { type Bounds, frameCamera, unionBounds } from "./frame-camera";

const GAP = 0.06;
const CHARACTER_HALF_WIDTH = 0.35;
export const CHARACTER_HEIGHT = 1.55;
// The camera frames the character and counter; side and back props may be cropped.
const FOCUS_SLOTS: ReadonlySet<SlotKind> = new Set(["counter", "counter-top"]);

export interface Segment {
  from: number;
  to: number;
}

export interface RowItem {
  width: number;
  depth: number;
}

export interface RowLayout {
  /** Center x per input item, or null when it didn't fit. */
  xs: readonly (number | null)[];
}

const segmentsFor = (center: number, width: number, keepClear = 0): Segment[] => {
  const from = center - width / 2;
  const to = center + width / 2;
  if (keepClear <= 0) return [{ from, to }];
  return [
    { from, to: center - keepClear / 2 },
    { from: center + keepClear / 2, to },
  ];
};

/** Packs items into segments (each into the one with the most room left), then centers each row in its segment. */
export const layoutRow = (items: readonly RowItem[], segments: readonly Segment[], maxDepth: number): RowLayout => {
  const rows = segments.map(() => ({ used: 0, members: [] as number[] }));
  items.forEach((item, index) => {
    if (item.depth > maxDepth) return;
    let best = -1;
    let bestFree = -Infinity;
    segments.forEach((segment, s) => {
      const row = rows[s];
      if (!row) return;
      const needed = row.used + (row.members.length > 0 ? GAP : 0) + item.width;
      const free = segment.to - segment.from - needed;
      if (free >= 0 && free > bestFree) {
        best = s;
        bestFree = free;
      }
    });
    const row = rows[best];
    if (!row) return;
    row.used += (row.members.length > 0 ? GAP : 0) + item.width;
    row.members.push(index);
  });

  const xs: (number | null)[] = items.map(() => null);
  rows.forEach((row, s) => {
    const segment = segments[s];
    if (!segment) return;
    let cursor = (segment.from + segment.to) / 2 - row.used / 2;
    for (const index of row.members) {
      const item = items[index];
      if (!item) continue;
      xs[index] = cursor + item.width / 2;
      cursor += item.width + GAP;
    }
  });
  return { xs };
};

interface Placed {
  prop: ResolvedProp;
  position: Vec3;
}

const boundsOf = ({ prop, position }: Placed): Bounds => {
  const [w, h, d] = prop.item.size;
  return { min: [position[0] - w / 2, position[1], position[2] - d / 2], max: [position[0] + w / 2, position[1] + h, position[2] + d / 2] };
};

// Surface slots (e.g. counter-top) shrink to the span of the surfaces placed in their base slot.
const surfaceSlot = (slot: SlotDef, base: readonly Placed[]): { slot: SlotDef; y: number } | undefined => {
  const surfaces = base.filter((p) => p.prop.item.surface !== undefined);
  if (surfaces.length === 0) return undefined;
  const bounds = surfaces.map(boundsOf);
  const from = Math.max(slot.center[0] - slot.width / 2, Math.min(...bounds.map((b) => b.min[0])));
  const to = Math.min(slot.center[0] + slot.width / 2, Math.max(...bounds.map((b) => b.max[0])));
  const y = Math.min(...surfaces.map((p) => p.prop.item.surface ?? 0));
  return { slot: { ...slot, center: [(from + to) / 2, y, slot.center[2]], width: Math.max(0, to - from) }, y };
};

const placeSlot = (slot: SlotDef, props: readonly ResolvedProp[], y: number, issues: RecipeIssue[]): Placed[] => {
  const segments = segmentsFor(slot.center[0], slot.width, slot.keepClear);
  const { xs } = layoutRow(
    props.map((p) => ({ width: p.item.size[0], depth: p.item.size[2] })),
    segments,
    slot.depth,
  );
  const placed: Placed[] = [];
  props.forEach((prop, i) => {
    const x = xs[i];
    if (x === null || x === undefined) {
      issues.push({ code: "no-space", detail: `No room for "${prop.item.id}" in "${slot.kind}".` });
      return;
    }
    placed.push({ prop, position: [x, y, slot.center[2]] });
  });
  return placed;
};

const slotOrder = (slots: readonly SlotDef[]): SlotDef[] => [...slots].sort((a, b) => Number(a.on !== undefined) - Number(b.on !== undefined));

export interface ComposeOptions {
  id: string;
  description?: string;
  aspect?: number;
  animationUrls?: readonly string[];
}

export interface ComposedScene {
  manifest: SceneManifest;
  issues: readonly RecipeIssue[];
}

/** Recipe → placed scene: lays props out per slot without overlaps, then frames the camera on the character and counter. */
export const composeScene = (recipe: ResolvedRecipe, options: ComposeOptions): ComposedScene => {
  const { room, character } = recipe;
  const issues: RecipeIssue[] = [];
  const placedBySlot = new Map<SlotKind, Placed[]>();

  for (const slot of slotOrder(room.slots)) {
    const props = recipe.props.filter((p) => p.slot === slot.kind);
    if (props.length === 0) continue;
    if (slot.on) {
      const surface = surfaceSlot(slot, placedBySlot.get(slot.on) ?? []);
      if (!surface) {
        for (const p of props) issues.push({ code: "no-surface", detail: `"${p.item.id}" needs something in "${slot.on}" to sit on.` });
        continue;
      }
      placedBySlot.set(slot.kind, placeSlot(surface.slot, props, surface.y, issues));
    } else {
      placedBySlot.set(slot.kind, placeSlot(slot, props, slot.center[1], issues));
    }
  }

  const placed = [...placedBySlot.values()].flat();
  const focus = [...placedBySlot].flatMap(([kind, items]) => (FOCUS_SLOTS.has(kind) ? items : []));
  const [cx, cy, cz] = room.characterSpot;
  const characterBounds: Bounds = {
    min: [cx - CHARACTER_HALF_WIDTH, cy, cz - CHARACTER_HALF_WIDTH],
    max: [cx + CHARACTER_HALF_WIDTH, cy + CHARACTER_HEIGHT, cz + CHARACTER_HALF_WIDTH],
  };
  const camera = frameCamera(unionBounds([characterBounds, ...focus.map(boundsOf)]), { aspect: options.aspect ?? 1.6 });

  const props: PropPlacement[] = placed.map(({ prop: { item }, position }) => ({
    id: item.id,
    url: item.url,
    position,
    scale: item.scale,
    ...(item.materials ? { materials: item.materials } : {}),
    ...(item.rotationY !== undefined ? { rotationY: item.rotationY } : {}),
  }));

  return {
    issues,
    manifest: {
      id: options.id,
      description: options.description ?? `${room.description} with a ${character.label.toLowerCase()} facing you.`,
      room: room.style,
      gradient: room.gradient,
      camera,
      character: { look: character.look, position: room.characterSpot, ...(character.model ? { model: character.model } : {}) },
      animationUrls: options.animationUrls ?? [],
      props,
    },
  };
};
