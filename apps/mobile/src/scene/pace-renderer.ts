import type { WebGLRenderer } from "three";

/** Web: the browser paces requestAnimationFrame itself. */
export const paceRenderer = (_renderer: WebGLRenderer): void => {};
