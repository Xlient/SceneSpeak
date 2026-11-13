import { describe, expect, it, vi } from "vitest";
import { backdropCacheKey, cachedBlobSource, createMemoryStore, hashText, speechCacheKey } from "./blob-cache";

const request = (cacheKey: string) => ({ cacheKey });

describe("cachedBlobSource", () => {
  it("generates once per key", async () => {
    const source = vi.fn((_: { cacheKey: string }) => Promise.resolve(new Blob(["a"])));
    const cached = cachedBlobSource(source, createMemoryStore());
    await cached(request("k"));
    await cached(request("k"));
    await cached(request("other"));
    expect(source).toHaveBeenCalledTimes(2);
  });

  it("shares one call between concurrent requests", async () => {
    const source = vi.fn((_: { cacheKey: string }) => Promise.resolve(new Blob(["a"])));
    const cached = cachedBlobSource(source, createMemoryStore());
    const [a, b] = await Promise.all([cached(request("k")), cached(request("k"))]);
    expect(a).toBe(b);
    expect(source).toHaveBeenCalledTimes(1);
  });

  it("doesn't cache failures", async () => {
    const source = vi
      .fn<(r: { cacheKey: string }) => Promise<Blob>>()
      .mockRejectedValueOnce(new Error("quota"))
      .mockResolvedValueOnce(new Blob(["ok"]));
    const cached = cachedBlobSource(source, createMemoryStore());
    await expect(cached(request("k"))).rejects.toThrow("quota");
    await expect(cached(request("k"))).resolves.toBeInstanceOf(Blob);
    expect(source).toHaveBeenCalledTimes(2);
  });
});

describe("cache keys", () => {
  it("change when the text changes", () => {
    expect(hashText("hola")).toBe(hashText("hola"));
    expect(hashText("hola")).not.toBe(hashText("hola!"));
    expect(speechCacheKey("lesson", "l1", "baker", "Hola")).not.toBe(speechCacheKey("lesson", "l1", "baker", "Adiós"));
    expect(backdropCacheKey("lesson", "a bakery")).toMatch(/^backdrop:lesson:/);
  });
});
