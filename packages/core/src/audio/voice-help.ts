import { baseLanguage, languageName } from "../language/languages";

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

export interface VoiceHelp {
  title: string;
  steps: readonly string[];
}

// macOS voices worth suggesting by name; Enhanced or Premium versions are downloadable.
const MAC_EXAMPLES: Readonly<Record<string, string>> = {
  es: "Mónica or Paulina",
  fr: "Amélie or Thomas",
  de: "Anna",
  ja: "Kyoko",
  it: "Alice",
  pt: "Luciana",
  ko: "Yuna",
  zh: "Tingting",
};

/** How to install a clearer offline voice for one language. Steps are short on purpose: OS menus move between versions. */
export const voiceHelp = (platform: Platform, language: string): VoiceHelp => {
  const name = languageName(language);
  const example = MAC_EXAMPLES[baseLanguage(language)];
  switch (platform) {
    case "mac":
      return {
        title: "On a Mac",
        steps: [
          "Open System Settings → Accessibility → Spoken Content.",
          "Next to System voice, choose Manage Voices…",
          `Download a ${name} voice marked Enhanced or Premium${example ? ` (for example ${example})` : ""}.`,
          "Restart Chrome, then pick the voice here.",
        ],
      };
    case "windows":
      return {
        title: "On Windows",
        steps: [
          "Open Settings → Time & language → Speech.",
          `Under Manage voices, choose Add voices and add ${name}.`,
          "Restart Chrome, then pick the voice here. (Microsoft Edge also offers clear online “Natural” voices.)",
        ],
      };
    case "chromeos":
      return {
        title: "On a Chromebook",
        steps: ["Open Settings → Accessibility → Text-to-Speech → Speech engines.", `Install or update the Google voices for ${name}, then pick one here.`],
      };
    case "android":
      return {
        title: "On Android",
        steps: ["Open Settings → Accessibility → Text-to-speech output.", `Choose Speech Services by Google → Install voice data → ${name}.`, "Reload this page and pick the voice here."],
      };
    case "ios":
      return {
        title: "On iPhone or iPad",
        steps: [`Open Settings → Accessibility → Spoken Content → Voices → ${name}.`, "Download an Enhanced or Premium voice, then reload this page."],
      };
    case "linux":
      return {
        title: "On Linux",
        steps: ["Voices depend on your speech engine (for example speech-dispatcher with espeak-ng or RHVoice).", `Install a ${name} voice for it, restart Chrome and pick it here.`],
      };
    case "other":
      return {
        title: "On your device",
        steps: ["Look for text-to-speech or spoken content voices in your system settings.", `Install a ${name} voice, restart the browser and pick it here.`],
      };
  }
};
