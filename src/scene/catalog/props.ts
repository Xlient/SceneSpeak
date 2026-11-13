import type { MaterialSettings, Vec3 } from "../scene-manifest";
import type { PropItem, SlotKind } from "./catalog-types";

const KAYKIT_DIR = "/assets/kaykit-restaurant";
const FURNITURE = 0.55;
const CRATE = 0.35;

interface PropSpec {
  file: string;
  label: string;
  tags: readonly string[];
  /** Model-space [width, height, depth] measured from the glTF bounds. */
  raw: Vec3;
  scale: number;
  fits: readonly SlotKind[];
  surface?: boolean;
  rotationY?: number;
}

const scaled = (raw: Vec3, scale: number): Vec3 => [raw[0] * scale, raw[1] * scale, raw[2] * scale];

const kaykit = (id: string, spec: PropSpec): PropItem => {
  const size = scaled(spec.raw, spec.scale);
  return {
    kind: "prop",
    id,
    label: spec.label,
    tags: spec.tags,
    url: `${KAYKIT_DIR}/${spec.file}.gltf`,
    scale: spec.scale,
    size,
    fits: spec.fits,
    ...(spec.surface ? { surface: size[1] } : {}),
    ...(spec.rotationY !== undefined ? { rotationY: spec.rotationY } : {}),
  };
};

const ON_COUNTER: readonly SlotKind[] = ["counter-top"];
const ON_FLOOR: readonly SlotKind[] = ["floor-left", "floor-right", "back"];

export const KAYKIT_PROPS: readonly PropItem[] = [
  kaykit("counter", { file: "kitchencounter_straight_A", label: "Counter", tags: ["counter", "shop", "kitchen", "bakery", "cafe", "bank", "office"], raw: [2, 1, 2.04], scale: FURNITURE, fits: ["counter", "back"], surface: true }),
  kaykit("work-table", { file: "kitchentable_A", label: "Work table", tags: ["table", "kitchen", "workshop"], raw: [2, 1, 2], scale: FURNITURE, fits: ["counter", "back"], surface: true }),
  kaykit("oven", { file: "oven", label: "Oven", tags: ["bakery", "kitchen", "restaurant"], raw: [2, 2.05, 2.35], scale: FURNITURE, fits: ["back"] }),
  kaykit("cafe-table", { file: "table_round_A_small", label: "Small round table", tags: ["cafe", "restaurant", "table"], raw: [1.5, 1, 1.5], scale: FURNITURE, fits: ON_FLOOR }),
  kaykit("cafe-table-set", { file: "table_round_A_small_decorated", label: "Round table with food", tags: ["cafe", "restaurant", "table", "food"], raw: [1.5, 1.8, 1.5], scale: FURNITURE, fits: ON_FLOOR }),
  kaykit("chair", { file: "chair_A", label: "Chair", tags: ["cafe", "restaurant", "office", "seat"], raw: [0.75, 1.21, 0.8], scale: FURNITURE, fits: ON_FLOOR }),
  kaykit("stool", { file: "chair_stool", label: "Stool", tags: ["cafe", "kitchen", "seat"], raw: [0.75, 0.5, 0.75], scale: FURNITURE, fits: ON_FLOOR }),
  kaykit("crate-buns", { file: "crate_buns", label: "Crate of bread rolls", tags: ["bakery", "bread", "food", "market"], raw: [2, 0.8, 2], scale: CRATE, fits: ON_FLOOR }),
  kaykit("crate-tomatoes", { file: "crate_tomatoes", label: "Crate of tomatoes", tags: ["market", "food", "vegetables"], raw: [2, 0.92, 2], scale: CRATE, fits: ON_FLOOR }),
  kaykit("crate-carrots", { file: "crate_carrots", label: "Crate of carrots", tags: ["market", "food", "vegetables"], raw: [2, 0.94, 2], scale: CRATE, fits: ON_FLOOR }),
  kaykit("crate-cheese", { file: "crate_cheese", label: "Crate of cheese", tags: ["market", "food"], raw: [2, 0.95, 2], scale: CRATE, fits: ON_FLOOR }),
  kaykit("bread-roll", { file: "food_ingredient_bun", label: "Bread roll", tags: ["bakery", "bread", "food"], raw: [0.7, 0.51, 0.7], scale: FURNITURE, fits: ON_COUNTER }),
  kaykit("plate", { file: "plate", label: "Plate", tags: ["cafe", "restaurant", "kitchen"], raw: [0.95, 0.1, 0.94], scale: FURNITURE, fits: ON_COUNTER }),
  kaykit("bowl", { file: "bowl", label: "Bowl", tags: ["kitchen", "restaurant"], raw: [0.95, 0.3, 0.95], scale: FURNITURE, fits: ON_COUNTER }),
  kaykit("jar", { file: "jar_A_medium", label: "Jar", tags: ["kitchen", "bakery", "shop"], raw: [0.5, 0.65, 0.5], scale: FURNITURE, fits: ON_COUNTER }),
  kaykit("big-jar", { file: "jar_C_large", label: "Big jar", tags: ["kitchen", "bakery", "shop"], raw: [0.5, 0.75, 0.5], scale: FURNITURE, fits: ON_COUNTER }),
  kaykit("menu", { file: "menu", label: "Menu stand", tags: ["cafe", "restaurant", "bakery", "price"], raw: [0.5, 0.8, 0.3], scale: FURNITURE, fits: ON_COUNTER }),
  kaykit("cutting-board", { file: "cuttingboard", label: "Cutting board", tags: ["kitchen", "food"], raw: [1.5, 0.15, 1], scale: FURNITURE, fits: ON_COUNTER }),
  kaykit("pot", { file: "pot_A", label: "Cooking pot", tags: ["kitchen", "restaurant"], raw: [1.4, 0.5, 1], scale: FURNITURE, fits: ON_COUNTER }),
  kaykit("stew", { file: "stew_bowl", label: "Bowl of stew", tags: ["restaurant", "food"], raw: [0.78, 0.37, 0.78], scale: FURNITURE, fits: ON_COUNTER }),
  kaykit("burger", { file: "food_burger", label: "Burger", tags: ["restaurant", "cafe", "food"], raw: [0.95, 0.86, 0.94], scale: FURNITURE, fits: ON_COUNTER }),
  kaykit("dinner-plate", { file: "food_dinner", label: "Dinner plate", tags: ["restaurant", "food"], raw: [1.03, 0.91, 0.94], scale: FURNITURE, fits: ON_COUNTER }),
  kaykit("ketchup", { file: "ketchup", label: "Ketchup bottle", tags: ["restaurant", "cafe"], raw: [0.3, 0.78, 0.3], scale: FURNITURE, fits: ON_COUNTER }),
  kaykit("mustard", { file: "mustard", label: "Mustard bottle", tags: ["restaurant", "cafe"], raw: [0.3, 0.78, 0.3], scale: FURNITURE, fits: ON_COUNTER }),
  kaykit("paper-towel", { file: "papertowel", label: "Paper towel roll", tags: ["kitchen"], raw: [0.5, 0.91, 0.5], scale: FURNITURE, fits: ON_COUNTER }),
];

// Nat Kit files are local-only (public/dev-assets is git-ignored) until the author confirms the license.
export const NAT_KIT_DIR = "/dev-assets/nat-kit";
// Raw Nat Kit characters are 2.2 tall; scaled to match the 1.55 chibi height.
export const NAT_KIT_SCALE = 1.55 / 2.2;
const NAT_KIT_MATERIALS: MaterialSettings = { textures: { Material: `${NAT_KIT_DIR}/texture.png` }, colors: { metal: 0x9aa3ad } };

const natKit = (id: string, file: string, label: string, tags: readonly string[], size: Vec3, fits: readonly SlotKind[], rotationY: number, surface?: number): PropItem => ({
  kind: "prop",
  id,
  label,
  tags,
  url: `${NAT_KIT_DIR}/${file}`,
  materials: NAT_KIT_MATERIALS,
  scale: NAT_KIT_SCALE,
  rotationY,
  size,
  fits,
  ...(surface !== undefined ? { surface } : {}),
  local: true,
});

export const NAT_KIT_PROPS: readonly PropItem[] = [
  natKit("workbench", "wood table.fbx", "Wooden workbench", ["workshop", "wood", "table"], [1.55, 0.676, 0.83], ["counter", "back"], Math.PI / 2, 0.676),
  natKit("saw", "saw_01.fbx", "Saw", ["workshop", "tool", "wood"], [0.54, 0.1, 0.24], ON_COUNTER, 0.3),
  natKit("hammer", "hammmer.fbx", "Hammer", ["workshop", "tool"], [0.36, 0.1, 0.18], ON_COUNTER, -0.6),
];
