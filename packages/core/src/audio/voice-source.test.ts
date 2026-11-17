import { describe, expect, it } from "vitest";
import { chooseVoiceSource } from "./voice-source";

const auto = { kind: "auto" } as const;
const cloud = { kind: "cloud" } as const;
const device = { kind: "device", voiceName: "Mónica" } as const;

describe("chooseVoiceSource", () => {
  it("auto plays the device voice right away and the cloud clip once it's ready", () => {
    expect(chooseVoiceSource(auto, { cloud: "loading", device: true })).toBe("device");
    expect(chooseVoiceSource(auto, { cloud: "ready", device: true })).toBe("cloud");
    expect(chooseVoiceSource(auto, { cloud: "unavailable", device: false })).toBe("none");
  });

  it("cloud waits for the AI voice and falls back to the device only when the cloud fails", () => {
    expect(chooseVoiceSource(cloud, { cloud: "loading", device: true })).toBe("loading");
    expect(chooseVoiceSource(cloud, { cloud: "ready", device: true })).toBe("cloud");
    expect(chooseVoiceSource(cloud, { cloud: "unavailable", device: true })).toBe("device");
  });

  it("a chosen device voice never switches to the cloud while the device can speak", () => {
    expect(chooseVoiceSource(device, { cloud: "ready", device: true })).toBe("device");
    expect(chooseVoiceSource(device, { cloud: "ready", device: false })).toBe("cloud");
  });

  it("is loading until the browser lists its voices", () => {
    expect(chooseVoiceSource(auto, { cloud: "unavailable", device: undefined })).toBe("loading");
    expect(chooseVoiceSource(device, { cloud: "unavailable", device: undefined })).toBe("loading");
  });
});
