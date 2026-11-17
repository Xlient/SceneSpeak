import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef, useState } from "react";
import { pickPhoneVoice } from "./device-voice";

type VoiceState = { status: "loading" } | { status: "ready"; voice: string } | { status: "none" };

const voiceCache = new Map<string, Promise<VoiceState>>();

// The voice list is stable for a session; look each language up once.
const findVoice = (language: string): Promise<VoiceState> => {
  let pending = voiceCache.get(language);
  if (!pending) {
    pending = Speech.getAvailableVoicesAsync()
      .then((voices): VoiceState => {
        const voice = pickPhoneVoice(voices, language);
        return voice ? { status: "ready", voice } : { status: "none" };
      })
      .catch((): VoiceState => ({ status: "none" }));
    voiceCache.set(language, pending);
  }
  return pending;
};

export interface LineVoiceOptions {
  text: string;
  language: string;
  autoPlay: boolean;
  onEnded?: (() => void) | undefined;
}

/** Reads a line aloud with the phone's own text-to-speech (no cloud call). */
export const useLineVoice = ({ text, language, autoPlay, onEnded }: LineVoiceOptions) => {
  const [voice, setVoice] = useState<VoiceState>({ status: "loading" });
  const [playing, setPlaying] = useState(false);
  const ended = useRef(onEnded);
  ended.current = onEnded;

  useEffect(() => {
    let live = true;
    void findVoice(language).then((found) => {
      if (live) setVoice(found);
    });
    return () => {
      live = false;
    };
  }, [language]);

  const play = useCallback(() => {
    if (voice.status !== "ready") return;
    void Speech.stop();
    setPlaying(true);
    const done = () => setPlaying(false);
    Speech.speak(text, {
      language,
      voice: voice.voice,
      rate: 0.9,
      onDone: () => {
        done();
        ended.current?.();
      },
      onStopped: done,
      onError: done,
    });
  }, [text, language, voice]);

  const stop = useCallback(() => {
    void Speech.stop();
    setPlaying(false);
  }, []);

  useEffect(() => {
    if (autoPlay && voice.status === "ready") play();
  }, [autoPlay, voice.status, play]);

  useEffect(() => () => void Speech.stop(), [text]);

  return { available: voice.status === "ready", missing: voice.status === "none", playing, play, stop };
};
