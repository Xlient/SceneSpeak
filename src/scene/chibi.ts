import * as THREE from "three";
import type { ChibiLook } from "./catalog/catalog-types";

const INK = 0x3b3550;
const CHEEK = 0xff9aa2;
const WHITE = 0xffffff;
// Built ~1.35 tall; scaled so the head clears KayKit counters.
const CHIBI_SCALE = 1.15;

const material = (color: number) => new THREE.MeshLambertMaterial({ color, flatShading: true });

const mesh = (geometry: THREE.BufferGeometry, color: number, position: THREE.Vector3Tuple, scale?: THREE.Vector3Tuple) => {
  const m = new THREE.Mesh(geometry, material(color));
  m.position.set(...position);
  if (scale) m.scale.set(...scale);
  return m;
};

const pivot = (name: string, position: THREE.Vector3Tuple, ...children: THREE.Object3D[]) => {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  group.add(...children);
  return group;
};

const limb = (color: number, handColor: number, length: number, radius: number) => [
  mesh(new THREE.CapsuleGeometry(radius, length, 3, 8), color, [0, -length / 2 - radius / 2, 0]),
  mesh(new THREE.SphereGeometry(radius * 1.15, 8, 6), handColor, [0, -length - radius, 0]),
];

const hat = (look: ChibiLook, headRadius: number): THREE.Object3D[] => {
  switch (look.hat) {
    case "chef":
      return [
        mesh(new THREE.CylinderGeometry(headRadius * 0.75, headRadius * 0.8, 0.12, 12), WHITE, [0, headRadius * 1.75, 0]),
        mesh(new THREE.SphereGeometry(headRadius * 0.8, 12, 8), WHITE, [0, headRadius * 2, 0], [1, 0.7, 1]),
      ];
    case "cap":
      return [
        mesh(new THREE.SphereGeometry(headRadius * 1.04, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), look.outfit, [0, headRadius * 1.08, 0]),
        mesh(new THREE.BoxGeometry(headRadius * 1.1, 0.03, headRadius * 0.7), look.outfit, [0, headRadius * 1.1, -headRadius * 0.95]),
      ];
    case "none":
      return [];
  }
};

/**
 * A toy-like chibi built from primitives, used when a character has no licensed model.
 * It faces -z with pivots named like Nat Kit bones, so `proceduralPose` drives it; place it with rotationY = π.
 */
export const createChibi = (look: ChibiLook): THREE.Group => {
  const headRadius = 0.3;
  const head = pivot(
    "head",
    [0, 0.4, 0],
    mesh(new THREE.SphereGeometry(headRadius, 18, 14), look.skin, [0, headRadius, 0]),
    mesh(new THREE.SphereGeometry(headRadius * 1.06, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), look.hair, [0, headRadius * 1.05, 0.03]),
    mesh(new THREE.SphereGeometry(0.042, 10, 8), INK, [-0.1, headRadius * 0.95, -headRadius * 0.93]),
    mesh(new THREE.SphereGeometry(0.042, 10, 8), INK, [0.1, headRadius * 0.95, -headRadius * 0.93]),
    mesh(new THREE.SphereGeometry(0.045, 10, 6), CHEEK, [-0.17, headRadius * 0.78, -headRadius * 0.86], [1, 0.6, 0.4]),
    mesh(new THREE.SphereGeometry(0.045, 10, 6), CHEEK, [0.17, headRadius * 0.78, -headRadius * 0.86], [1, 0.6, 0.4]),
    mesh(new THREE.SphereGeometry(0.025, 8, 6), INK, [0, headRadius * 0.7, -headRadius * 0.97], [1.4, 0.7, 0.6]),
    ...hat(look, headRadius),
  );

  const torso: THREE.Object3D[] = [mesh(new THREE.CapsuleGeometry(0.19, 0.16, 4, 12), look.outfit, [0, 0.2, 0])];
  if (look.apron !== undefined) torso.push(mesh(new THREE.BoxGeometry(0.26, 0.3, 0.04), look.apron, [0, 0.14, -0.18]));

  const spine = pivot(
    "spine",
    [0, 0.02, 0],
    ...torso,
    pivot("armR", [0.23, 0.32, 0], ...limb(look.outfit, look.skin, 0.16, 0.06)),
    pivot("armL", [-0.23, 0.32, 0], ...limb(look.outfit, look.skin, 0.16, 0.06)),
    head,
  );

  const hips = pivot(
    "hips",
    [0, 0.3, 0],
    pivot("legR", [0.09, 0, 0], ...limb(INK, INK, 0.12, 0.075)),
    pivot("legL", [-0.09, 0, 0], ...limb(INK, INK, 0.12, 0.075)),
    spine,
  );

  const root = new THREE.Group();
  root.name = "chibi";
  root.add(hips);
  root.scale.setScalar(CHIBI_SCALE);
  return root;
};
