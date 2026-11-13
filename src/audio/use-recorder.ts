import { useCallback, useEffect, useReducer, useRef } from "react";
import { MAX_RECORDING_MS, isRecordingSupported, recorderReducer } from "./recorder-state";

interface Session {
  recorder: MediaRecorder;
  stream: MediaStream;
  timer: number;
}

/** Push-to-talk recording held only in memory. The blob goes to `onRecorded` and nowhere else. */
export const useRecorder = (onRecorded: (audio: Blob) => void) => {
  const [state, dispatch] = useReducer(recorderReducer, undefined, () =>
    isRecordingSupported() ? { status: "idle" as const } : { status: "unsupported" as const },
  );
  const session = useRef<Session | null>(null);
  const callback = useRef(onRecorded);
  callback.current = onRecorded;

  const release = useCallback(() => {
    const current = session.current;
    if (!current) return;
    window.clearTimeout(current.timer);
    for (const track of current.stream.getTracks()) track.stop();
    session.current = null;
  }, []);

  const stop = useCallback(() => {
    const recorder = session.current?.recorder;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }, []);

  const start = useCallback(async () => {
    if (session.current || !isRecordingSupported()) return;
    dispatch({ type: "request" });
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      dispatch(error instanceof DOMException && error.name === "NotAllowedError" ? { type: "denied" } : { type: "failed", message: "Couldn't open the microphone." });
      return;
    }
    const recorder = new MediaRecorder(stream);
    let chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const audio = new Blob(chunks, { type: recorder.mimeType });
      chunks = [];
      release();
      dispatch({ type: "stopped" });
      if (audio.size > 0) callback.current(audio);
    };
    session.current = { recorder, stream, timer: window.setTimeout(stop, MAX_RECORDING_MS) };
    recorder.start();
    dispatch({ type: "started", at: Date.now() });
  }, [release, stop]);

  useEffect(
    () => () => {
      const recorder = session.current?.recorder;
      if (recorder) recorder.onstop = null;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      release();
    },
    [release],
  );

  return { state, start, stop, reset: () => dispatch({ type: "reset" }) };
};
