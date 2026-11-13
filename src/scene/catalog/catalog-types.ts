import type { MaterialSettings, Vec3 } from "../scene-manifest";

export const SLOT_KINDS = ["counter", "counter-top", "back", "floor-left", "floor-right"] as const;
export type SlotKind = (typeof SLOT_KINDS)[number];

export const ROOM_STYLES = ["workshop", "bakery", "shop"] as const;
export type RoomStyle = (typeof ROOM_STYLES)[number];

export interface PropItem {
  kind: "prop";
  id: string;
  label: string;
  tags: readonly string[];
  url: string;
  materials?: MaterialSettings;
  scale: number;
  rotationY?: number;
  /** [width, height, depth] in scene units after scaling. */
  size: Vec3;
  /** Top height for items that others can sit on. */
  surface?: number;
  fits: readonly SlotKind[];
  /** Git-ignored dev asset; missing in production builds. */
  local?: true;
}

export const HATS = ["none", "chef", "cap"] as const;
export type Hat = (typeof HATS)[number];

export interface ChibiLook {
  skin: number;
  hair: number;
  outfit: number;
  apron?: number;
  hat: Hat;
}

export interface CharacterModel {
  url: string;
  materials?: MaterialSettings;
  rotationY: number;
  height: number;
  local?: true;
}

export interface CharacterItem {
  kind: "character";
  id: string;
  label: string;
  tags: readonly string[];
  look: ChibiLook;
  model?: CharacterModel;
}

export interface SlotDef {
  kind: SlotKind;
  center: Vec3;
  width: number;
  depth: number;
  /** Surface slots sit on top of whatever was placed in this slot. */
  on?: SlotKind;
  /** Width kept empty in the middle (e.g. so the character stays visible). */
  keepClear?: number;
}

export interface RoomItem {
  kind: "room";
  id: string;
  label: string;
  tags: readonly string[];
  style: RoomStyle;
  description: string;
  characterSpot: Vec3;
  slots: readonly SlotDef[];
  /** CSS gradient stops shown when there's no painted backdrop. */
  gradient: readonly [string, string];
}

export interface Catalog {
  props: readonly PropItem[];
  characters: readonly CharacterItem[];
  rooms: readonly RoomItem[];
  fallbackRoomId: string;
  fallbackCharacterId: string;
}
