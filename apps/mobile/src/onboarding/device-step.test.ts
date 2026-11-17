import { describe, expect, it } from "vitest";
import { describeNativeDevice } from "./device-step";

describe("describeNativeDevice", () => {
  it("offers a download on Android only", () => {
    expect(describeNativeDevice({ status: "downloadable" }, "android").canSetUp).toBe(true);
    const ios = describeNativeDevice({ status: "downloadable" }, "ios");
    expect(ios.canSetUp).toBe(false);
    expect(ios.body).toMatch(/Settings/);
  });

  it("passes the native reason through when unavailable", () => {
    expect(describeNativeDevice({ status: "unavailable", reason: "Not connected yet." }, "android").body).toMatch(/^Not connected yet\./);
  });

  it("says when it's ready", () => {
    expect(describeNativeDevice({ status: "available" }, "ios").title).toBe("On-device AI is ready");
  });
});
