import { describe, expect, it } from "vitest";
import { createFramePacer } from "./frame-pacer";

describe("createFramePacer", () => {
  it("renders every frame while frames are fast", () => {
    const pacer = createFramePacer(50);
    pacer.frameDone(0, 5);
    expect(pacer.shouldRender(6)).toBe(true);
  });

  it("rests as long as a slow frame took, then renders again", () => {
    const pacer = createFramePacer(50);
    pacer.frameDone(0, 1000);
    expect(pacer.shouldRender(1500)).toBe(false);
    expect(pacer.shouldRender(2000)).toBe(true);
  });

  it("stops resting once frames are fast again", () => {
    const pacer = createFramePacer(50);
    pacer.frameDone(0, 1000);
    pacer.frameDone(2000, 2010);
    expect(pacer.shouldRender(2011)).toBe(true);
  });
});
