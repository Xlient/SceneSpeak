import type { VoiceChoice } from "./voice-preference";

export type VoiceSource = "loading" | "cloud" | "device" | "none";

export interface VoiceAvailability {
  cloud: "loading" | "ready" | "unavailable";
  /** Undefined until the browser has listed its voices. */
  device: boolean | undefined;
}

/** Which voice plays a line, given the learner's choice and what's available right now. */
export const chooseVoiceSource = (choice: VoiceChoice, { cloud, device }: VoiceAvailability): VoiceSource => {
  const deviceOr = (otherwise: VoiceSource): VoiceSource => (device ? "device" : device === undefined ? "loading" : otherwise);
  switch (choice.kind) {
    case "cloud":
      // Wait for the AI voice the learner asked for; use the device only if the cloud can't deliver.
      if (cloud === "ready") return "cloud";
      return cloud === "loading" ? "loading" : deviceOr("none");
    case "device":
      return deviceOr(cloud === "ready" ? "cloud" : cloud === "loading" ? "loading" : "none");
    case "auto":
      // Device first: play the device voice at once, upgrade to the cloud clip once it's cached.
      if (cloud === "ready") return "cloud";
      return device ? "device" : device === undefined || cloud === "loading" ? "loading" : "none";
  }
};
