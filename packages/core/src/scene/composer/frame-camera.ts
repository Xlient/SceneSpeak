import type { CameraView, Vec3 } from "../scene-manifest";

export interface Bounds {
  min: Vec3;
  max: Vec3;
}

export interface FrameOptions {
  aspect: number;
  fovDegrees?: number;
  pitch?: number;
  margin?: number;
  minDistance?: number;
}

export const DEFAULT_FOV = 40;

export const unionBounds = (all: readonly Bounds[]): Bounds => ({
  min: [Math.min(...all.map((b) => b.min[0])), Math.min(...all.map((b) => b.min[1])), Math.min(...all.map((b) => b.min[2]))],
  max: [Math.max(...all.map((b) => b.max[0])), Math.max(...all.map((b) => b.max[1])), Math.max(...all.map((b) => b.max[2]))],
});

/** Places a slightly-raised camera in front (+z) of the bounds so the whole box fits the view. */
export const frameCamera = (bounds: Bounds, options: FrameOptions): CameraView => {
  const { aspect, fovDegrees = DEFAULT_FOV, pitch = 0.2, margin = 1.12, minDistance = 2.4 } = options;
  const halfV = (fovDegrees * Math.PI) / 360;
  const halfH = Math.atan(Math.tan(halfV) * aspect);
  const center: Vec3 = [
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  ];
  const halfWidth = (bounds.max[0] - bounds.min[0]) / 2;
  const halfHeight = (bounds.max[1] - bounds.min[1]) / 2;
  const halfDepth = (bounds.max[2] - bounds.min[2]) / 2;
  // Pitch tilts the box's depth into the vertical view, so it counts toward the height to fit.
  const tiltedHalfHeight = halfHeight * Math.cos(pitch) + halfDepth * Math.sin(pitch);
  const distance = Math.max(
    minDistance,
    Math.max(halfWidth / Math.tan(halfH), tiltedHalfHeight / Math.tan(halfV)) * margin + halfDepth,
  );
  return {
    target: center,
    position: [center[0], center[1] + Math.sin(pitch) * distance, center[2] + Math.cos(pitch) * distance],
  };
};
