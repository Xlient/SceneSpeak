import type { VoiceSource } from "./use-pronunciation";

const SOURCE_TITLE: Record<VoiceSource, string> = {
  loading: "Loading voice…",
  cloud: "AI voice (generated once in the cloud, then cached)",
  device: "Your device's built-in voice",
  none: "No voice for this language on this device",
};

export interface SpeakButtonProps {
  text: string;
  label?: string;
  source: VoiceSource;
  playing: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export const SpeakButton = ({ text, label, source, playing, onPlay, onStop }: SpeakButtonProps) => (
  <button
    type="button"
    className={`speak-button ${playing ? "playing" : ""}`}
    aria-label={playing ? "Stop" : `Hear “${text}”`}
    title={SOURCE_TITLE[source]}
    disabled={source === "loading" || source === "none"}
    onClick={playing ? onStop : onPlay}
  >
    <span aria-hidden="true">{playing ? "⏹" : "🔊"}</span>
    {label && <span>{label}</span>}
  </button>
);
