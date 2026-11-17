export type Platform = "mac" | "windows" | "chromeos" | "android" | "ios" | "linux" | "other";

export const detectPlatform = (userAgent: string): Platform => {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  if (/CrOS/i.test(userAgent)) return "chromeos";
  if (/Mac OS X|Macintosh/i.test(userAgent)) return "mac";
  if (/Windows/i.test(userAgent)) return "windows";
  if (/Linux/i.test(userAgent)) return "linux";
  return "other";
};

/** How to install a clearer offline voice. Steps are short on purpose: OS menus move between versions. */
export const VOICE_HELP: Readonly<Record<Platform, { title: string; steps: readonly string[] }>> = {
  mac: {
    title: "On a Mac",
    steps: [
      "Open System Settings → Accessibility → Spoken Content.",
      "Next to System voice, choose Manage Voices…",
      "Download a Spanish voice marked Enhanced or Premium (for example Mónica or Paulina).",
      "Restart Chrome, then pick the voice here.",
    ],
  },
  windows: {
    title: "On Windows",
    steps: [
      "Open Settings → Time & language → Speech.",
      "Under Manage voices, choose Add voices and add Spanish.",
      "Restart Chrome, then pick the voice here. (Microsoft Edge also offers clear online “Natural” voices.)",
    ],
  },
  chromeos: {
    title: "On a Chromebook",
    steps: ["Open Settings → Accessibility → Text-to-Speech → Speech engines.", "Install or update the Google voices for Spanish, then pick one here."],
  },
  android: {
    title: "On Android",
    steps: ["Open Settings → Accessibility → Text-to-speech output.", "Choose Speech Services by Google → Install voice data → Spanish.", "Reload this page and pick the voice here."],
  },
  ios: {
    title: "On iPhone or iPad",
    steps: ["Open Settings → Accessibility → Spoken Content → Voices → Spanish.", "Download an Enhanced or Premium voice, then reload this page."],
  },
  linux: {
    title: "On Linux",
    steps: ["Voices depend on your speech engine (for example speech-dispatcher with espeak-ng or RHVoice).", "Install a Spanish voice for it, restart Chrome and pick it here."],
  },
  other: {
    title: "On your device",
    steps: ["Look for text-to-speech or spoken content voices in your system settings.", "Install a Spanish voice, restart the browser and pick it here."],
  },
};
