import { describe, expect, it } from "vitest";
import type { DeviceModelStatus } from "../ai/device";
import { describeDeviceStep } from "./device-step";

describe("describeDeviceStep", () => {
  it("offers set up only while idle", () => {
    const statuses: DeviceModelStatus[] = [
      { kind: "idle" },
      { kind: "not-supported" },
      { kind: "checking" },
      { kind: "downloading", progress: 0.4 },
      { kind: "ready" },
      { kind: "unavailable", reason: "no space" },
    ];
    expect(statuses.filter((s) => describeDeviceStep(s).canSetUp).map((s) => s.kind)).toEqual(["idle"]);
  });

  it("explains the cloud fallback whenever Nano isn't ready", () => {
    for (const status of [{ kind: "idle" }, { kind: "not-supported" }, { kind: "downloading", progress: 0 }] as const) {
      expect(describeDeviceStep(status).body).toMatch(/cloud/);
    }
    expect(describeDeviceStep({ kind: "ready" }).body).not.toMatch(/cloud/);
  });
});
