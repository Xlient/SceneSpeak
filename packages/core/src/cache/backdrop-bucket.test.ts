import { describe, expect, it } from "vitest";
import { readBackdropBucket } from "./backdrop-bucket";

describe("readBackdropBucket", () => {
  it("accepts a bucket name", () => {
    expect(readBackdropBucket(" scenespeak-12331-backdrops ")).toBe("scenespeak-12331-backdrops");
  });

  it("is undefined when unset or invalid", () => {
    for (const value of [undefined, "", "gs://x-backdrops", "Has-Caps", "a", "bad/name"]) {
      expect(readBackdropBucket(value)).toBeUndefined();
    }
  });
});
