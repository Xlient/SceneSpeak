import { useCallback, useEffect, useRef } from "react";
import { speechCacheKey } from "../cache/blob-cache";
import type { Line } from "../schemas";
import { useServices } from "./services-context";
import { useGeneratedMedia } from "./use-object-url";

export interface LineAudioProps {
  lessonId: string;
  line: Line;
  language: string;
  autoPlay: boolean;
}

/** Character voice for one line. Captions live in the speech bubble, so this only adds sound. */
export const LineAudio = ({ lessonId, line, language, autoPlay }: LineAudioProps) => {
  const { speech } = useServices();
  const audioRef = useRef<HTMLAudioElement>(null);
  const key = speechCacheKey(lessonId, line.id, line.speaker, line.text);
  const load = useCallback(
    (signal: AbortSignal) => speech({ cacheKey: key, text: line.text, language, characterId: line.speaker, signal }),
    [speech, key, line.text, line.speaker, language],
  );
  const media = useGeneratedMedia(load, key);

  useEffect(() => {
    if (media.status !== "ready" || !autoPlay) return;
    // Autoplay can be blocked until the first user gesture; the replay button still works.
    audioRef.current?.play().catch(() => undefined);
  }, [media, autoPlay]);

  if (media.status === "unavailable") {
    return <p className="audio-note">🔇 {media.message} Read the caption instead.</p>;
  }

  return (
    <div className="line-audio">
      {media.status === "ready" && <audio ref={audioRef} src={media.url} preload="auto" />}
      <button
        type="button"
        className="secondary small"
        disabled={media.status !== "ready"}
        onClick={() => {
          const audio = audioRef.current;
          if (!audio) return;
          audio.currentTime = 0;
          void audio.play().catch(() => undefined);
        }}
      >
        {media.status === "loading" ? "Loading voice…" : "🔊 Play again"}
      </button>
    </div>
  );
};
