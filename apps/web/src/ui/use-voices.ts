import { useEffect, useState, useSyncExternalStore } from "react";
import { rankVoices } from "@scenespeak/core/audio/browser-voice";
import { type VoiceChoice, voicePreferences } from "@scenespeak/core/audio/voice-preference";

const installedVoices = (): SpeechSynthesisVoice[] => (typeof speechSynthesis === "undefined" ? [] : speechSynthesis.getVoices());

/** The browser's voices for a language, clearest first; updates when Chrome finishes loading them. */
export const useBrowserVoices = (lang: string): SpeechSynthesisVoice[] => {
  const [voices, setVoices] = useState(() => rankVoices(installedVoices(), lang));
  useEffect(() => {
    const update = () => setVoices(rankVoices(installedVoices(), lang));
    update();
    if (typeof speechSynthesis === "undefined") return;
    speechSynthesis.addEventListener("voiceschanged", update);
    return () => speechSynthesis.removeEventListener("voiceschanged", update);
  }, [lang]);
  return voices;
};

export const useVoiceChoice = (lang: string): [VoiceChoice, (choice: VoiceChoice) => void] => {
  const choice = useSyncExternalStore(voicePreferences.subscribe, () => voicePreferences.get(lang));
  return [choice, (next) => voicePreferences.set(lang, next)];
};
