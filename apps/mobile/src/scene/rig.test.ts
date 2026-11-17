import { Object3D } from "three";
import { describe, expect, it } from "vitest";
import { applyPose, findRig } from "./rig";

const rigged = () => {
  const root = new Object3D();
  for (const name of ["head", "armR", "unrelated"]) {
    const bone = new Object3D();
    bone.name = name;
    root.add(bone);
  }
  return root;
};

describe("findRig", () => {
  it("keeps only known pose bones, with their bind rotation", () => {
    const root = rigged();
    root.getObjectByName("head")?.rotation.set(0.1, 0, 0);
    const rig = findRig(root);
    expect([...rig.keys()].sort()).toEqual(["armR", "head"]);
    expect(rig.get("head")?.bind).toEqual([0.1, 0, 0]);
  });
});

describe("applyPose", () => {
  it("moves bones relative to the bind pose and returns to it at rest", () => {
    const root = rigged();
    root.getObjectByName("armR")?.rotation.set(0, 0.5, 0);
    const rig = findRig(root);
    applyPose(rig, "talk", 0.3);
    const arm = root.getObjectByName("armR");
    expect(arm?.rotation.x).toBeGreaterThan(0);
    applyPose(rig, "idle", 0);
    expect(arm?.rotation.toArray().slice(0, 3)).toEqual([0, 0.5, 0]);
  });
});
