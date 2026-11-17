import { describe, expect, it } from "vitest";
import { CATALOG } from "./catalog";
import { catalogAssetUrls } from "./preload";
import { KAYKIT_TEXTURE } from "./props";

describe("catalogAssetUrls", () => {
  const urls = catalogAssetUrls(CATALOG);

  it("includes each glTF with its .bin and the shared atlas once", () => {
    expect(urls).toContain("/assets/kaykit-restaurant/oven.gltf");
    expect(urls).toContain("/assets/kaykit-restaurant/oven.bin");
    expect(urls.filter((u) => u === KAYKIT_TEXTURE)).toHaveLength(1);
  });

  it("skips local-only models", () => {
    expect(urls.some((u) => u.includes("dev-assets"))).toBe(false);
  });
});
