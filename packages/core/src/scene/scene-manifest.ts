import type { CharacterModel, ChibiLook, RoomStyle } from "./catalog/catalog-types";

export type Vec3 = readonly [number, number, number];

export interface MaterialSettings {
  textures?: Readonly<Record<string, string>>;
  colors?: Readonly<Record<string, number>>;
}

export interface CameraView {
  position: Vec3;
  target: Vec3;
}

export interface PropPlacement {
  id: string;
  url: string;
  materials?: MaterialSettings;
  position: Vec3;
  rotationY?: number;
  scale?: number;
}

export interface CharacterPlacement {
  look: ChibiLook;
  model?: CharacterModel;
  position: Vec3;
}

/** Everything the 3D player needs; built from a scene recipe by the composer. */
export interface SceneManifest {
  id: string;
  description: string;
  room: RoomStyle;
  gradient: readonly [string, string];
  camera: CameraView;
  character: CharacterPlacement;
  animationUrls: readonly string[];
  props: readonly PropPlacement[];
}
