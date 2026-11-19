import type { BackdropTheme } from "../audio/media-sources";
import type { RoomStyle } from "../scene/catalog/catalog-types";
import { ROOM_PALETTES, hexColor } from "../scene/room-palettes";

const ROOM_KIND: Record<RoomStyle, string> = {
  workshop: "a cosy wooden carpentry workshop",
  bakery: "a sunny little bakery",
  shop: "a bright, friendly shop",
};

/**
 * The painting sits behind a low-poly 3D set: floor, side walls, a counter and a character are drawn in front of it.
 * So it shows only the far wall, straight on, with nothing that would clash with the 3D layer.
 */
export const buildBackdropPrompt = ({ setting, theme }: { setting: string; theme: BackdropTheme }): string => {
  const palette = ROOM_PALETTES[theme.room];
  const scene = setting.replace(/\s+/g, " ").trim().slice(0, 300);
  return [
    "Paint a wide background for a cute low-poly 3D game scene.",
    `Place: ${ROOM_KIND[theme.room]}. Scene: ${scene}`,
    "Show only the far back wall of the room, seen straight on at eye level, filling the whole image edge to edge: no border, frame, pillars, side walls, ceiling or floor (the 3D room supplies those). Fill the wall with details that fit the place: shelves, windows, plants, framed pictures, signs with no writing.",
    "Keep the bottom third plain and simple: a counter and props are placed in front of it. Leave the middle uncluttered: a character stands there.",
    `Style: soft pastel colours, chunky rounded shapes, simple flat-shaded low-poly forms, gentle light from above, toy-like and family friendly. Main wall colour ${hexColor(palette.wall)}, trim ${hexColor(palette.trim)}, accent ${hexColor(palette.accent)}; through any window, a sky from ${theme.gradient[0]} to ${theme.gradient[1]}.`,
    "Never include people, animals, characters, faces, text, letters, numbers, logos or watermarks.",
  ].join("\n");
};
