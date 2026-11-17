import { describe, expect, it } from "vitest";
import { resolveClipName } from "./clip-resolver";

const clips = ["Idle_Loop", "Idle_Talking_Loop", "Walk_Formal_Loop", "Interact", "Sitting_Idle_Loop"];

describe("resolveClipName", () => {
  it("prefers the exact idle loop over other idle clips", () => {
    expect(resolveClipName("idle", clips)).toBe("Idle_Loop");
  });

  it("maps talk to the talking idle", () => {
    expect(resolveClipName("talk", clips)).toBe("Idle_Talking_Loop");
  });

  it("maps point to interact", () => {
    expect(resolveClipName("point", clips)).toBe("Interact");
  });

  it("falls back to talk when a gesture is missing", () => {
    expect(resolveClipName("wave", clips)).toBe("Idle_Talking_Loop");
  });

  it("falls back to idle for think", () => {
    expect(resolveClipName("think", clips)).toBe("Idle_Loop");
  });

  it("returns undefined with no clips", () => {
    expect(resolveClipName("talk", [])).toBeUndefined();
  });
});
