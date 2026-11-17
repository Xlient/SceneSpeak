/** Frames slower than this get an equal rest afterwards. */
export const SLOW_FRAME_MS = 50;

export interface FramePacer {
  /** Whether to draw at `now`; false while resting after a slow frame. */
  shouldRender(now: number): boolean;
  /** Record a finished frame that started at `start` and ended at `end`. */
  frameDone(start: number, end: number): void;
}

// A slow GPU (the iOS simulator's software GL) would otherwise keep the JS thread busy drawing,
// leaving nothing for taps and navigation. Resting as long as the frame took gives JS about half.
export const createFramePacer = (slowMs: number = SLOW_FRAME_MS): FramePacer => {
  let resumeAt = 0;
  return {
    shouldRender: (now) => now >= resumeAt,
    frameDone: (start, end) => {
      const cost = end - start;
      resumeAt = cost > slowMs ? end + cost : 0;
    },
  };
};
