import type { CharacterItem } from "./catalog-types";
import { NAT_KIT_DIR } from "./props";

// Nat Kit models face +x; rotating -90° makes them face the camera.
const NAT_KIT_WORKER = {
  url: `${NAT_KIT_DIR}/worker.fbx`,
  materials: { textures: { Material: `${NAT_KIT_DIR}/texture.png`, cara: `${NAT_KIT_DIR}/face normal.png` } },
  rotationY: -Math.PI / 2,
  height: 1.55,
  local: true,
} as const;

export const CHARACTERS: readonly CharacterItem[] = [
  {
    kind: "character",
    id: "carpenter",
    label: "Carpenter",
    tags: ["workshop", "wood", "tools"],
    look: { skin: 0xf2c7a5, hair: 0x6b4a32, outfit: 0x8cc8ef, apron: 0xc98b5a, hat: "none" },
    model: NAT_KIT_WORKER,
  },
  {
    kind: "character",
    id: "baker",
    label: "Baker",
    tags: ["bakery", "bread", "cafe", "food"],
    look: { skin: 0xd9a27e, hair: 0x3b2a20, outfit: 0xff9aa2, apron: 0xfff7ec, hat: "chef" },
  },
  {
    kind: "character",
    id: "barista",
    label: "Barista",
    tags: ["cafe", "coffee", "restaurant"],
    look: { skin: 0xf5d0b5, hair: 0xc77d3a, outfit: 0x8fd6b4, apron: 0x7a5236, hat: "cap" },
  },
  {
    kind: "character",
    id: "clerk",
    label: "Shop clerk",
    tags: ["shop", "bank", "office", "hotel", "market"],
    look: { skin: 0xa8734f, hair: 0x2b2233, outfit: 0xc9b6f2, hat: "none" },
  },
];
