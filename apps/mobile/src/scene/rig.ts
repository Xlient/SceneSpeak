import type { Object3D } from "three";
import type { Animation } from "@scenespeak/core/schemas";
import { POSE_BONES, type PoseBone, proceduralPose } from "@scenespeak/core/scene/procedural-pose";

export interface RigBone {
  bone: Object3D;
  bind: readonly [number, number, number];
}

export type Rig = ReadonlyMap<PoseBone, RigBone>;

export const findRig = (root: Object3D): Rig => {
  const rig = new Map<PoseBone, RigBone>();
  for (const name of POSE_BONES) {
    const bone = root.getObjectByName(name);
    if (bone) rig.set(name, { bone, bind: [bone.rotation.x, bone.rotation.y, bone.rotation.z] });
  }
  return rig;
};

/** Offsets each bone from its bind rotation; same motion as the web player's procedural mode. */
export const applyPose = (rig: Rig, animation: Animation, time: number): void => {
  const pose = proceduralPose(animation, time);
  for (const [name, { bone, bind }] of rig) {
    const [x, y, z] = pose[name] ?? [0, 0, 0];
    bone.rotation.set(bind[0] + x, bind[1] + y, bind[2] + z);
  }
};
