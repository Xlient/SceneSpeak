import * as THREE from "three";
import type { RoomStyle } from "./catalog/catalog-types";
import { ROOM_PALETTES } from "./room-palettes";

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
  const p = ROOM_PALETTES[style];
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
