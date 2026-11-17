// Core uses Array.prototype.toSorted (ES2023); older Hermes builds lack it.
export const installToSorted = (proto: { toSorted?: unknown }): void => {
  if (typeof proto.toSorted === "function") return;
  Object.defineProperty(proto, "toSorted", {
    configurable: true,
    writable: true,
    value: function toSorted<T>(this: readonly T[], compare?: (a: T, b: T) => number): T[] {
      return [...this].sort(compare);
    },
  });
};
