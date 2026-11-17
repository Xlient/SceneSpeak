import type { DeviceModelInfo } from "../ai-port/hybrid-model";

export interface NativeDeviceStep {
  title: string;
  body: string;
  /** Show "Set up": Android can download Gemini Nano; iOS manages its model in Settings. */
  canSetUp: boolean;
}

const CLOUD_FALLBACK = "Until then, grading uses Google's Gemini in the cloud.";

/** The welcome tour's on-device AI step, for the app (the web version talks about Chrome). */
export const describeNativeDevice = (info: DeviceModelInfo, platform: "android" | "ios" | "web"): NativeDeviceStep => {
  const model = platform === "ios" ? "Apple Intelligence" : "Gemini Nano";
  switch (info.status) {
    case "available":
      return { title: "On-device AI is ready", body: "Your replies are checked right here on your phone: private, free and fast.", canSetUp: false };
    case "downloading":
      return { title: "Setting up on-device AI…", body: `You can keep going while ${model} downloads. ${CLOUD_FALLBACK}`, canSetUp: false };
    case "downloadable":
      return platform === "ios"
        ? {
            title: "Turn on private, on-device AI",
            body: `Turn on Apple Intelligence in your iPhone's Settings so replies can be checked on your phone. ${CLOUD_FALLBACK}`,
            canSetUp: false,
          }
        : {
            title: "Turn on private, on-device AI",
            body: `Your phone can run ${model}, so your replies stay private. It's a one-time download managed by Android. ${CLOUD_FALLBACK}`,
            canSetUp: true,
          };
    case "unavailable":
      return {
        title: "On-device AI isn't available here",
        body: `${info.reason ? `${info.reason} ` : ""}Everything else still works. ${CLOUD_FALLBACK}`,
        canSetUp: false,
      };
  }
};
