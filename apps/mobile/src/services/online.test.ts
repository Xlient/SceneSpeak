import { describe, expect, it } from "vitest";
import { isOnlineFrom } from "./online";

describe("isOnlineFrom", () => {
  it("is offline only when the OS reports it", () => {
    expect(isOnlineFrom({ isConnected: true, isInternetReachable: true })).toBe(true);
    expect(isOnlineFrom({})).toBe(true);
    expect(isOnlineFrom({ isConnected: false })).toBe(false);
    expect(isOnlineFrom({ isConnected: true, isInternetReachable: false })).toBe(false);
  });
});
