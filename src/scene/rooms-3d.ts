import * as THREE from "three";
import type { RoomStyle } from "./catalog/catalog-types";

interface RoomPalette {
  floor: number;
  wall: number;
  sideWall: number;
  trim: number;
  accent: number;
}

const PALETTES: Record<RoomStyle, RoomPalette> = {
  workshop: { floor: 0xc9a77c, wall: 0xf3e6d3, sideWall: 0xead7bd, trim: 0x9b6b43, accent: 0x8fb8d8 },
  bakery: { floor: 0xe7c9a9, wall: 0xffe4ea, sideWall: 0xffd6de, trim: 0xd98c6a, accent: 0xffd970 },
  shop: { floor: 0xd8cfc0, wall: 0xe3f4ec, sideWall: 0xd3ecf6, trim: 0x8a9bb5, accent: 0xc9b6f2 },
};

const box = (size: THREE.Vector3Tuple, color: number, position: THREE.Vector3Tuple): THREE.Mesh => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshLambertMaterial({ color, flatShading: true }));
  mesh.position.set(...position);
  return mesh;
};

export interface RoomOptions {
  /** Off when a painted backdrop shows through behind the set. */
  backWall: boolean;
}

export const createRoom = (style: RoomStyle, { backWall }: RoomOptions): THREE.Group => {
  const p = PALETTES[style];
  const group = new THREE.Group();
  group.name = `room-${style}`;
  group.add(box([9, 0.1, 7], p.floor, [0, -0.05, -0.5]));
  group.add(box([0.1, 3, 6], p.sideWall, [-3.6, 1.5, -1]));
  group.add(box([0.1, 3, 6], p.sideWall, [3.6, 1.5, -1]));
  if (backWall) {
    group.add(box([9, 3, 0.1], p.wall, [0, 1.5, -3]));
    group.add(box([9, 0.25, 0.12], p.trim, [0, 0.12, -2.94]));
    group.add(box([2.2, 0.08, 0.35], p.trim, [-1.6, 1.85, -2.8]));
    group.add(box([1.3, 0.9, 0.05], p.accent, [1.7, 1.9, -2.94]));
  }
  return group;
};
