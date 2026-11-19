import { describe, expect, it } from "vitest";
import { sharedBackdropKey } from "./shared-key";

const input = (overrides: Partial<{ setting: string; room: "bakery" | "shop"; model: string }> = {}) => ({
  setting: overrides.setting ?? "A sunny bakery in Cozy Town.",
  theme: { room: overrides.room ?? "bakery", gradient: ["#fff", "#eee"] as const },
  model: overrides.model ?? "gemini-nano-banana-2.1",
});

describe("sharedBackdropKey", () => {
  it("is 64 lowercase hex characters, as the security rules require", async () => {
    expect(await sharedBackdropKey(input())).toMatch(/^[0-9a-f]{64}$/);
  });

  it("gives the same key for the same scene, ignoring case and spacing", async () => {
    const a = await sharedBackdropKey(input());
    expect(await sharedBackdropKey(input({ setting: "  a SUNNY   bakery in cozy town. " }))).toBe(a);
  });

  it("changes when the scene, room or model changes", async () => {
    const base = await sharedBackdropKey(input());
    expect(await sharedBackdropKey(input({ setting: "A rainy bakery." }))).not.toBe(base);
    expect(await sharedBackdropKey(input({ room: "shop" }))).not.toBe(base);
    expect(await sharedBackdropKey(input({ model: "another-model" }))).not.toBe(base);
  });

  it("matches a known SHA-256 so it's stable across browsers", async () => {
    // sha256("v2|m|bakery|hi") — recompute with: printf 'v2|m|bakery|hi' | shasum -a 256
    expect(await sharedBackdropKey({ setting: "Hi", theme: { room: "bakery", gradient: ["#fff", "#eee"] }, model: "m" })).toBe(
      "d2fe976d1915e2726f1c78d784460d2adf30c337fb5cad5ff18141ea4b0a344c",
    );
  });
});
