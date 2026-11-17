import type { Catalog, CharacterItem, PropItem, RoomItem } from "./catalog-types";
import { CHARACTERS } from "./characters";
import { KAYKIT_PROPS, NAT_KIT_PROPS } from "./props";
import { ROOMS } from "./rooms";

export const CATALOG: Catalog = {
  props: [...KAYKIT_PROPS, ...NAT_KIT_PROPS],
  characters: CHARACTERS,
  rooms: ROOMS,
  fallbackRoomId: "shop-counter",
  fallbackCharacterId: "clerk",
};

export const findProp = (catalog: Catalog, id: string): PropItem | undefined => catalog.props.find((p) => p.id === id);
export const findCharacter = (catalog: Catalog, id: string): CharacterItem | undefined =>
  catalog.characters.find((c) => c.id === id);
export const findRoom = (catalog: Catalog, id: string): RoomItem | undefined => catalog.rooms.find((r) => r.id === id);

export const fallbackRoom = (catalog: Catalog): RoomItem => {
  const room = findRoom(catalog, catalog.fallbackRoomId) ?? catalog.rooms[0];
  if (!room) throw new Error("Catalog has no rooms");
  return room;
};

export const fallbackCharacter = (catalog: Catalog): CharacterItem => {
  const character = findCharacter(catalog, catalog.fallbackCharacterId) ?? catalog.characters[0];
  if (!character) throw new Error("Catalog has no characters");
  return character;
};
