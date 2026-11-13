import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOG, fallbackCharacter, fallbackRoom } from "./catalog";
import type { SlotDef } from "./catalog-types";

const PUBLIC = join(__dirname, "../../../public");

const overlaps = (a: SlotDef, b: SlotDef) =>
  Math.abs(a.center[0] - b.center[0]) < (a.width + b.width) / 2 && Math.abs(a.center[2] - b.center[2]) < (a.depth + b.depth) / 2;

describe("CATALOG", () => {
  it("has unique IDs in each section", () => {
    for (const items of [CATALOG.props, CATALOG.characters, CATALOG.rooms]) {
      const ids = items.map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("resolves its fallbacks", () => {
    expect(fallbackRoom(CATALOG).id).toBe(CATALOG.fallbackRoomId);
    expect(fallbackCharacter(CATALOG).id).toBe(CATALOG.fallbackCharacterId);
  });

  it("ships every non-local prop file, with the glTF's buffers and textures", () => {
    for (const prop of CATALOG.props.filter((p) => !p.local)) {
      const file = join(PUBLIC, prop.url);
      expect(existsSync(file), prop.url).toBe(true);
      const gltf = JSON.parse(readFileSync(file, "utf8")) as { buffers?: { uri: string }[]; images?: { uri: string }[] };
      for (const { uri } of [...(gltf.buffers ?? []), ...(gltf.images ?? [])]) {
        expect(existsSync(join(file, "..", uri)), uri).toBe(true);
      }
    }
  });

  it("keeps unlicensed files out of tracked paths", () => {
    const local = [...CATALOG.props.filter((p) => p.local).map((p) => p.url), ...CATALOG.characters.flatMap((c) => (c.model?.local ? [c.model.url] : []))];
    for (const url of local) expect(url.startsWith("/dev-assets/")).toBe(true);
  });

  it("only lets surfaces hold counter-top items", () => {
    for (const room of CATALOG.rooms) {
      for (const slot of room.slots.filter((s) => s.on)) {
        expect(room.slots.some((s) => s.kind === slot.on)).toBe(true);
        const holders = CATALOG.props.filter((p) => slot.on && p.fits.includes(slot.on));
        expect(holders.some((p) => p.surface !== undefined)).toBe(true);
      }
    }
  });

  it("lays out floor slots without overlapping each other or the character", () => {
    for (const room of CATALOG.rooms) {
      const floor = room.slots.filter((s) => !s.on);
      const character: SlotDef = { kind: "counter", center: room.characterSpot, width: 0.6, depth: 0.6 };
      floor.forEach((a, i) => {
        expect(overlaps(a, character), `${room.id}/${a.kind}`).toBe(false);
        for (const b of floor.slice(i + 1)) expect(overlaps(a, b), `${room.id}/${a.kind}+${b.kind}`).toBe(false);
      });
    }
  });

  it("gives each prop a slot it fits in every room", () => {
    for (const prop of CATALOG.props) {
      expect(prop.fits.length).toBeGreaterThan(0);
      for (const room of CATALOG.rooms) expect(prop.fits.some((kind) => room.slots.some((s) => s.kind === kind))).toBe(true);
    }
  });
});
