import { type VoiceLike, pickVoice } from "@scenespeak/core/audio/browser-voice";

/** The fields of an expo-speech Voice that picking needs. */
export interface PhoneVoice {
  identifier: string;
  name: string;
  quality: string;
  language: string;
}

interface RankedVoice extends VoiceLike {
  identifier: string;
}

// Phone voices are all on-device; "Enhanced" maps onto the name test core's ranking already uses.
const toVoiceLike = (voice: PhoneVoice): RankedVoice => ({
  identifier: voice.identifier,
  lang: voice.language,
  name: voice.quality === "Enhanced" ? `${voice.name} enhanced` : voice.name,
  localService: true,
  default: false,
});

/** The clearest phone voice for a language (same ranking as the web app's browser voices), or undefined. */
export const pickPhoneVoice = (voices: readonly PhoneVoice[], language: string): string | undefined =>
  pickVoice(voices.map(toVoiceLike), language)?.identifier;
