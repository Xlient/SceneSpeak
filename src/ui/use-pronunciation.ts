import { useCallback, useEffect, useRef, useState } from "react";
import { hasBrowserVoice, speakWithBrowser, waitForVoices } from "../audio/browser-voice";
import { chooseVoiceSource } from "../audio/voice-source";
import { speechCacheKey } from "../cache/blob-cache";
import { useVoiceChoice } from "./use-voices";
import { useServices } from "./services-context";
import { useGeneratedMedia } from "./use-object-url";

export type { VoiceSource } from "../audio/voice-source";

export interface PronunciationRequest {
  lessonId: string;
  lineId: string;
  /** Character ID, so each character keeps one cloud voice. */
  speaker: string;
  text: string;
  language: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

/**
 * Plays a line with the learner's chosen voice. "Auto" is device first: the browser's voice plays at once and the
 * cloud AI voice takes over once its clip is ready (fetched in the background and cached).
 */
export const usePronunciation = ({ lessonId, lineId, speaker, text, language, autoPlay = false, onEnded }: PronunciationRequest) => {
  const { speech } = useServices();
  const key = speechCacheKey(lessonId, lineId, speaker, text);
  const load = useCallback(
    (signal: AbortSignal) => speech({ cacheKey: key, text, language, characterId: speaker, signal }),
    [speech, key, text, language, speaker],
  );
  const media = useGeneratedMedia(load, key);
  const [deviceVoice, setDeviceVoice] = useState<boolean | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const stopDevice = useRef<(() => void) | null>(null);
  const endedRef = useRef(onEnded);
  useEffect(() => {
    endedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    let active = true;
    void waitForVoices().then(() => {
      if (active) setDeviceVoice(hasBrowserVoice(language));
    });
    return () => {
      active = false;
    };
  }, [language]);

  const [choice] = useVoiceChoice(language);
  const source = chooseVoiceSource(choice, { cloud: media.status, device: deviceVoice });
  const voiceName = choice.kind === "device" ? choice.voiceName : undefined;

  const stop = useCallback(() => {
    audio.current?.pause();
    stopDevice.current?.();
    stopDevice.current = null;
    setPlaying(false);
  }, []);

  const finish = useCallback(() => {
    setPlaying(false);
    endedRef.current?.();
  }, []);

  const play = useCallback(() => {
    stop();
    if (media.status === "ready") {
      audio.current ??= new Audio();
      const element = audio.current;
      element.src = media.url;
      element.onended = finish;
      setPlaying(true);
      // Autoplay can be blocked until the first user gesture; the button still works.
      element.play().catch(() => setPlaying(false));
    } else if (source === "device") {
      setPlaying(true);
      stopDevice.current = speakWithBrowser(text, language, finish, voiceName);
    }
  }, [media, source, text, language, voiceName, stop, finish]);

  const autoPlayed = useRef<string | null>(null);
  useEffect(() => {
    if (!autoPlay || source === "loading" || source === "none" || autoPlayed.current === key) return;
    autoPlayed.current = key;
    play();
  }, [autoPlay, source, key, play]);

  useEffect(() => stop, [key, stop]);

  return { source, playing, play, stop };
};
