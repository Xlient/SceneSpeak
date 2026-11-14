import type { DeviceModelStatus } from "../ai/device";

export type DeviceTone = "off" | "busy" | "ready" | "error";

export interface DeviceStatusView {
  label: string;
  tone: DeviceTone;
  /** Set only when a Set up / Try again button should show. */
  action?: string;
  progress?: number;
  detail?: string;
}

export const describeDeviceStatus = (status: DeviceModelStatus): DeviceStatusView => {
  switch (status.kind) {
    case "idle":
      return { label: "On-device AI: not set up", tone: "off", action: "Set up" };
    case "not-supported":
      return { label: "On-device AI: not in this browser (using cloud)", tone: "off" };
    case "checking":
      return { label: "On-device AI: checking…", tone: "busy" };
    case "downloading":
      return {
        label: `On-device AI: downloading ${Math.round(status.progress * 100)}%`,
        tone: "busy",
        progress: status.progress,
      };
    case "ready":
      return { label: "On-device AI: ready", tone: "ready" };
    case "unavailable":
      return { label: "On-device AI: unavailable (using cloud)", tone: "error", action: "Try again", detail: status.reason };
  }
};
