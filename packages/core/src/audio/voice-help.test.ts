import { describe, expect, it } from "vitest";
import { detectPlatform } from "./voice-help";

describe("detectPlatform", () => {
  it.each([
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/142.0 Safari/537.36", "mac"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/142.0", "windows"],
    ["Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) Chrome/142.0", "chromeos"],
    ["Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/142.0 Mobile", "android"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1", "ios"],
    ["Mozilla/5.0 (X11; Linux x86_64) Chrome/142.0", "linux"],
    ["SomethingElse/1.0", "other"],
  ] as const)("%s → %s", (ua, platform) => {
    expect(detectPlatform(ua)).toBe(platform);
  });
});
