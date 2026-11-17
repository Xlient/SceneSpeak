import type { DeviceModelStatus } from "../ai/device";

export interface DeviceStepView {
  title: string;
  body: string;
  /** Show the Set up button; it must be clicked directly so Chrome allows the download. */
  canSetUp: boolean;
  tone: "ready" | "busy" | "off";
}

const CLOUD_FALLBACK = "Until then, grading uses Google's Gemini in the cloud, and the private weekly coach stays off.";

export const describeDeviceStep = (status: DeviceModelStatus): DeviceStepView => {
  switch (status.kind) {
    case "ready":
      return { title: "On-device AI is ready", body: "Your replies are checked right here on your device: private, free and fast.", canSetUp: false, tone: "ready" };
    case "checking":
    case "downloading":
      return { title: "Setting up on-device AI…", body: `You can keep going while it downloads. ${CLOUD_FALLBACK}`, canSetUp: false, tone: "busy" };
    case "idle":
      return {
        title: "Turn on private, on-device AI",
        body: `Chrome can run Gemini Nano on your device, so your replies and practice stats stay private. It's a one-time download of a few GB. ${CLOUD_FALLBACK}`,
        canSetUp: true,
        tone: "off",
      };
    case "not-supported":
      return {
        title: "On-device AI isn't available in this browser",
        body: `It needs a recent desktop Chrome. Everything else still works. ${CLOUD_FALLBACK}`,
        canSetUp: false,
        tone: "off",
      };
    case "unavailable":
      return {
        title: "On-device AI can't run here",
        body: `This device doesn't meet Chrome's requirements (free storage, memory or graphics). Everything else still works. ${CLOUD_FALLBACK}`,
        canSetUp: false,
        tone: "off",
      };
  }
};
