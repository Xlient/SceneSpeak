import type { RoomStyle } from "./catalog/catalog-types";

export interface RoomPalette {
  floor: number;
  wall: number;
  sideWall: number;
  trim: number;
  accent: number;
}

/** Shared by the 3D room and the painted backdrop prompt, so both use the same colours. */
export const ROOM_PALETTES: Readonly<Record<RoomStyle, RoomPalette>> = {
  workshop: { floor: 0xc9a77c, wall: 0xf3e6d3, sideWall: 0xead7bd, trim: 0x9b6b43, accent: 0x8fb8d8 },
  bakery: { floor: 0xe7c9a9, wall: 0xffe4ea, sideWall: 0xffd6de, trim: 0xd98c6a, accent: 0xffd970 },
  shop: { floor: 0xd8cfc0, wall: 0xe3f4ec, sideWall: 0xd3ecf6, trim: 0x8a9bb5, accent: 0xc9b6f2 },
};

export const hexColor = (color: number): string => `#${color.toString(16).padStart(6, "0")}`;
