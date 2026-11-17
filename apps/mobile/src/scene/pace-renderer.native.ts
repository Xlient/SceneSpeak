import type { WebGLRenderer } from "three";
import { createFramePacer } from "./frame-pacer";

/**
 * expo-gl queues GL commands for its own thread, so JS can issue frames far faster than a slow GPU
 * draws them and the queue grows without bound (the iOS simulator lagged minutes behind).
 * One blocking call per frame makes JS wait for the GPU; the pacer then skips frames after slow ones.
 */
export const paceRenderer = (renderer: WebGLRenderer): void => {
  const gl = renderer.getContext();
  const pacer = createFramePacer();
  const render = renderer.render.bind(renderer);
  renderer.render = (scene, camera) => {
    const start = Date.now();
    if (!pacer.shouldRender(start)) return;
    render(scene, camera);
    gl.getError();
    pacer.frameDone(start, Date.now());
  };
};
