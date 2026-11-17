import type { Vec3 } from "../scene-manifest";
import type { RoomItem, RoomStyle, SlotDef } from "./catalog-types";

const CHARACTER_SPOT: Vec3 = [0, 0, -1.02];

// One shared stage layout: counter in front of the character, back wall behind, two side spots.
const STAGE_SLOTS: readonly SlotDef[] = [
  { kind: "counter", center: [0, 0, -0.1], width: 2.6, depth: 1.2 },
  { kind: "counter-top", center: [0, 0, -0.1], width: 2.5, depth: 1.0, on: "counter", keepClear: 0.5 },
  { kind: "back", center: [0, 0, -2.05], width: 3.6, depth: 1.4 },
  { kind: "floor-left", center: [-2.05, 0, -0.5], width: 1.2, depth: 1.4 },
  { kind: "floor-right", center: [2.05, 0, -0.5], width: 1.2, depth: 1.4 },
];

const room = (
  id: string,
  style: RoomStyle,
  label: string,
  tags: readonly string[],
  description: string,
  gradient: readonly [string, string],
): RoomItem => ({ kind: "room", id, label, tags, style, description, characterSpot: CHARACTER_SPOT, slots: STAGE_SLOTS, gradient });

export const ROOMS: readonly RoomItem[] = [
  room("wood-workshop", "workshop", "Wood workshop", ["workshop", "wood", "tools", "hardware"], "A cozy wood workshop", ["#ffe3c2", "#f3c99a"]),
  room("bakery", "bakery", "Bakery", ["bakery", "bread", "cafe", "food", "restaurant"], "A sunny little bakery", ["#ffe1ea", "#ffd2b8"]),
  room("shop-counter", "shop", "Shop counter", ["shop", "bank", "office", "hotel", "market", "post"], "A bright shop with a counter", ["#d9f3e7", "#bfe2f5"]),
];
