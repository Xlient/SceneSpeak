import { describe, expect, it } from "vitest";
import { installToSorted } from "./array-to-sorted";

describe("installToSorted", () => {
  it("adds a copying sort when missing and keeps a native one", () => {
    const proto: { toSorted?: unknown } = {};
    installToSorted(proto);
    const toSorted = proto.toSorted as (this: number[], compare?: (a: number, b: number) => number) => number[];
    const input = [3, 1, 2];
    expect(toSorted.call(input, (a, b) => a - b)).toEqual([1, 2, 3]);
    expect(input).toEqual([3, 1, 2]);

    const native = Array.prototype.toSorted;
    installToSorted(Array.prototype);
    expect(Array.prototype.toSorted).toBe(native);
  });
});
