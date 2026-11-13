import { describe, expect, it } from "vitest";
import type { CameraView, Vec3 } from "../scene-manifest";
import { type Bounds, DEFAULT_FOV, frameCamera, unionBounds } from "./frame-camera";

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};

// Normalised device coords of a point for a look-at camera; both within [-1, 1] means it's in view.
const project = (camera: CameraView, point: Vec3, aspect: number) => {
  const forward = norm(sub(camera.target, camera.position));
  const right = norm(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const rel = sub(point, camera.position);
  const depth = dot(rel, forward);
  const t = Math.tan((DEFAULT_FOV * Math.PI) / 360);
  return { x: dot(rel, right) / (depth * t * aspect), y: dot(rel, up) / (depth * t), depth };
};

const corners = ({ min, max }: Bounds): Vec3[] =>
  [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [i & 1 ? max[0] : min[0], i & 2 ? max[1] : min[1], i & 4 ? max[2] : min[2]]);

describe("frameCamera", () => {
  it.each([
    ["a small counter", { min: [-1.3, 0, -1.3], max: [1.3, 1.35, 0.5] }],
    ["a wide stage", { min: [-2.6, 0, -2.8], max: [2.6, 1.4, 0.5] }],
    ["a tall prop", { min: [-0.5, 0, -0.5], max: [0.5, 2.5, 0.5] }],
  ] as const)("keeps %s fully in view", (_, bounds) => {
    for (const aspect of [1.6, 1]) {
      const camera = frameCamera(bounds, { aspect });
      for (const corner of corners(bounds)) {
        const p = project(camera, corner, aspect);
        expect(p.depth).toBeGreaterThan(0);
        expect(Math.abs(p.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(p.y)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("looks at the middle from the front and above", () => {
    const camera = frameCamera({ min: [-1, 0, -1], max: [1, 1, 1] }, { aspect: 1.6 });
    expect(camera.target).toEqual([0, 0.5, 0]);
    expect(camera.position[2]).toBeGreaterThan(1);
    expect(camera.position[1]).toBeGreaterThan(0.5);
  });
});

describe("unionBounds", () => {
  it("covers every box", () => {
    expect(unionBounds([{ min: [0, 0, 0], max: [1, 1, 1] }, { min: [-2, 0.5, 0], max: [0, 3, 0.5] }])).toEqual({ min: [-2, 0, 0], max: [1, 3, 1] });
  });
});
