import { describe, expect, it } from "vitest";
import { describeDeviceStatus } from "./device-status";

describe("describeDeviceStatus", () => {
  it("offers Set up when idle", () => {
    expect(describeDeviceStatus({ kind: "idle" })).toMatchObject({ tone: "off", action: "Set up" });
  });

  it("offers no button when the browser can't run it", () => {
    expect(describeDeviceStatus({ kind: "not-supported" })).not.toHaveProperty("action");
  });

  it("shows download progress as a whole percent", () => {
    expect(describeDeviceStatus({ kind: "downloading", progress: 0.426 })).toEqual({
      label: "On-device AI: downloading 43%",
      tone: "busy",
      progress: 0.426,
    });
  });

  it("offers no button while busy or ready", () => {
    expect(describeDeviceStatus({ kind: "checking" })).not.toHaveProperty("action");
    expect(describeDeviceStatus({ kind: "ready" })).toEqual({ label: "On-device AI: ready", tone: "ready" });
  });

  it("offers a retry and keeps the reason when unavailable", () => {
    expect(describeDeviceStatus({ kind: "unavailable", reason: "no space" })).toMatchObject({
      tone: "error",
      action: "Try again",
      detail: "no space",
    });
  });
});
