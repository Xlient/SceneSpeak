import { useId } from "react";
import { MAX_RECORDING_MS } from "@scenespeak/core/audio/recorder-state";
import { useRecorder } from "../audio/use-recorder";

export interface VoiceReplyProps {
  disabled: boolean;
  onRecorded: (audio: Blob) => void;
  /** Bigger mic button, for Speaking mode. */
  primary?: boolean;
}

const STATUS_TEXT = {
  idle: "",
  requesting: "Waiting for microphone permission…",
  recording: "Recording… press Stop when you're done.",
  denied: "Microphone access was blocked. You can still type your reply.",
  unsupported: "This browser can't record audio. Type your reply instead.",
} as const;

/** Push-to-talk. The recording stays in memory, goes to cloud grading once, then is dropped. */
export const VoiceReply = ({ disabled, onRecorded, primary = false }: VoiceReplyProps) => {
  const { state, start, stop } = useRecorder(onRecorded);
  const noteId = useId();
  const recording = state.status === "recording";
  const message = state.status === "error" ? state.message : STATUS_TEXT[state.status];

  return (
    <div className="voice-reply">
      <button
        type="button"
        className={`mic ${primary ? "primary" : ""} ${recording ? "recording" : ""}`}
        aria-pressed={recording}
        aria-describedby={noteId}
        disabled={disabled || state.status === "unsupported" || state.status === "requesting"}
        onClick={() => (recording ? stop() : void start())}
      >
        {recording ? "■ Stop" : "🎙️ Speak"}
      </button>
      <p id={noteId} className="cloud-note">
        <span className="badge cloud">Cloud</span> Your voice is sent to Gemini in the cloud to check it, then thrown away. It's never saved. Max{" "}
        {MAX_RECORDING_MS / 1000} s.
      </p>
      <p className="visually-hidden" role="status" aria-live="polite">
        {message}
      </p>
      {message && state.status !== "recording" && <p className="audio-note">{message}</p>}
    </div>
  );
};
