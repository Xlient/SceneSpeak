import {
  AudioQuality,
  IOSOutputFormat,
  type RecordingOptions,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { File } from "expo-file-system";
import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_RECORDING_MS } from "@scenespeak/core/audio/recorder-state";
import type { InlineAudio } from "../ai-port/hybrid-model";
import { recordingMimeType } from "./recording-format";

// 16 kHz mono is plenty for speech and keeps uploads small.
const VOICE_RECORDING: RecordingOptions = {
  directory: "cache",
  extension: ".aac",
  sampleRate: 16_000,
  numberOfChannels: 1,
  bitRate: 32_000,
  android: { extension: ".aac", outputFormat: "aac_adts", audioEncoder: "aac" },
  ios: {
    extension: ".wav",
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.MEDIUM,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
};

export type VoiceReplyState = { kind: "idle" } | { kind: "recording" } | { kind: "error"; message: string };

/** Reads the recording into memory and deletes the file right away: voice is never kept on the device. */
const takeRecording = async (uri: string): Promise<InlineAudio> => {
  const file = new File(uri);
  try {
    const mimeType = recordingMimeType(uri);
    if (!mimeType) throw new Error(`Unsupported recording format: ${uri}`);
    return { mimeType, data: await file.base64() };
  } finally {
    try {
      file.delete();
    } catch {
      // Already gone.
    }
  }
};

/** Tap to record, tap to stop (auto-stops at the web app's 15 s limit). */
export const useVoiceReply = (onRecorded: (audio: InlineAudio) => void) => {
  const recorder = useAudioRecorder(VOICE_RECORDING);
  const [state, setState] = useState<VoiceReplyState>({ kind: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = useRef(onRecorded);
  done.current = onRecorded;

  const stop = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    try {
      await recorder.stop();
      setState({ kind: "idle" });
      if (recorder.uri) done.current(await takeRecording(recorder.uri));
    } catch {
      setState({ kind: "error", message: "Couldn't use that recording. Please try again." });
    }
  }, [recorder]);

  const start = useCallback(async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setState({ kind: "error", message: "SceneSpeak needs the microphone for voice replies. Allow it in Settings, or type instead." });
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState({ kind: "recording" });
      timer.current = setTimeout(() => void stop(), MAX_RECORDING_MS);
    } catch {
      setState({ kind: "error", message: "Couldn't start recording. Please try again, or type instead." });
    }
  }, [recorder, stop]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { state, start, stop };
};
