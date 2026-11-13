import type { Animation } from "../schemas";

export const POSE_BONES = ["hips", "spine", "head", "armL", "armR", "legL", "legR"] as const;
export type PoseBone = (typeof POSE_BONES)[number];
export type Euler3 = readonly [number, number, number];
export type Pose = Partial<Record<PoseBone, Euler3>>;

const wave = (t: number, hz: number, amplitude: number) => Math.sin(t * Math.PI * 2 * hz) * amplitude;

// Radian offsets from the bind pose for one-bone-per-limb rigs (Nat Kit style), measured with the
// character facing +z: armR raises on +z, armL on -z, arms swing forward on +x, head nods down on -x.
export const proceduralPose = (animation: Animation, t: number): Pose => {
  const spine: Euler3 = [wave(t, 0.5, 0.03), 0, 0];
  switch (animation) {
    case "idle":
      return { spine, head: [0, wave(t, 0.2, 0.1), 0] };
    case "talk":
      return {
        spine,
        head: [-Math.abs(wave(t, 2, 0.08)), wave(t, 0.6, 0.12), 0],
        armR: [0.3 + wave(t, 1, 0.2), 0, 0.3 + wave(t, 0.8, 0.15)],
      };
    case "wave":
      return { spine, head: [0, 0, wave(t, 0.5, 0.08) - 0.1], armR: [0.2, 0, 2.3 + wave(t, 2, 0.3)] };
    case "nod":
      return { spine, head: [-Math.abs(wave(t, 1.2, 0.35)), 0, 0] };
    case "point":
      return { spine, head: [0, 0, -0.1], armR: [1.3, 0, 0.9] };
    case "think":
      return { spine, head: [0.1, 0, 0.2 + wave(t, 0.3, 0.05)], armL: [1.1, 0, -1.3] };
  }
};
