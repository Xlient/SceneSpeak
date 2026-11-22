import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef, useState } from "react";
import { speechLocale } from "@scenespeak/core/language/languages";
import { pickPhoneVoice } from "./device-voice";

type VoiceState = { status: "loading" } | { status: "ready"; voice: string } | { status: "none" };

const voiceCache = new Map<string, Promise<VoiceState>>();

// The voice list is stable for a session; look each language up once.
const findVoice = (language: string): Promise<VoiceState> => {
  let pending = voiceCache.get(language);
  if (!pending) {
    pending = Speech.getAvailableVoicesAsync()
      .then((voices): VoiceState => {
        // Android returns an empty list until its speech engine has started; don't remember that as "no voice".
        if (voices.length === 0) voiceCache.delete(language);
        const voice = pickPhoneVoice(voices, language);
        return voice ? { status: "ready", voice } : { status: "none" };
      })
      .catch((): VoiceState => {
        voiceCache.delete(language);
        return { status: "none" };
      });
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
    let retry: ReturnType<typeof setTimeout> | undefined;
    void findVoice(language).then((found) => {
      if (!live) return;
      setVoice(found);
      // One late retry covers a speech engine that was still starting.
      if (found.status === "none")
        retry = setTimeout(() => void findVoice(language).then((again) => live && setVoice(again)), 1500);
    });
    return () => {
      live = false;
      clearTimeout(retry);
    };
  }, [language]);

  const [playingWord, setPlayingWord] = useState<number | null>(null);

  // Single words never advance the lesson, so they skip onEnded.
  const playWord = useCallback(
    (word: string, index: number) => {
      if (voice.status !== "ready") return;
      void Speech.stop();
      setPlaying(false);
      setPlayingWord(index);
      const done = () => setPlayingWord(null);
      Speech.speak(word, { language: speechLocale(language), voice: voice.voice, rate: 0.9, onDone: done, onStopped: done, onError: done });
    },
    [language, voice],
  );

  const play = useCallback(() => {
    if (voice.status !== "ready") return;
    void Speech.stop();
    setPlayingWord(null);
    setPlaying(true);
    const done = () => setPlaying(false);
    Speech.speak(text, {
      language: speechLocale(language),
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
    setPlayingWord(null);
  }, []);

  useEffect(() => {
    if (autoPlay && voice.status === "ready") play();
  }, [autoPlay, voice.status, play]);

  useEffect(() => () => void Speech.stop(), [text]);

  return { available: voice.status === "ready", missing: voice.status === "none", playing, play, stop, playingWord, playWord };
};
