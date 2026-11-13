import { describe, expect, it } from "vitest";
import { ANIMATIONS } from "../schemas";
import { POSE_BONES, proceduralPose } from "./procedural-pose";

describe("proceduralPose", () => {
  it.each(ANIMATIONS)("returns only known bones with finite values for %s", (animation) => {
    for (const t of [0, 0.37, 5]) {
      const pose = proceduralPose(animation, t);
      for (const [bone, euler] of Object.entries(pose)) {
        expect(POSE_BONES).toContain(bone);
        expect(euler.every(Number.isFinite)).toBe(true);
      }
    }
  });

  it("raises the right arm to wave", () => {
    for (const t of [0, 0.1, 0.2, 0.3]) expect(proceduralPose("wave", t).armR?.[2]).toBeGreaterThan(1.8);
  });

  it("only nods the head downwards", () => {
    for (const t of [0, 0.1, 0.25, 0.6]) expect(proceduralPose("nod", t).head?.[0]).toBeLessThanOrEqual(0);
  });

  it("brings the left arm up and forward to think", () => {
    const [forward, , raise] = proceduralPose("think", 0).armL ?? [0, 0, 0];
    expect(forward).toBeGreaterThan(0);
    expect(raise).toBeLessThan(0);
  });

  it("is still at t=0 for reduced motion idle", () => {
    expect(proceduralPose("idle", 0)).toEqual({ spine: [0, 0, 0], head: [0, 0, 0] });
  });
});
