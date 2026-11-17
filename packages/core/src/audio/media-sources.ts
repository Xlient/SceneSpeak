import { notConnected } from "../services/not-connected";
import type { Line, Scenario } from "../schemas";

export interface SpeechRequest {
  cacheKey: string;
  text: string;
  language: string;
  /** Catalog character ID, so each character keeps one voice. */
  characterId: string;
  signal: AbortSignal;
}

/** Cloud TTS (Gemini, `responseModalities: ["AUDIO"]`) plugs in here. Returns playable audio. */
export type SpeechSource = (request: SpeechRequest) => Promise<Blob>;

export interface BackdropRequest {
  cacheKey: string;
  setting: string;
  signal: AbortSignal;
}

/** Cloud image generation plugs in here. Returns a PNG/JPEG blob of the painted backdrop. */
export type BackdropPainter = (request: BackdropRequest) => Promise<Blob>;

export interface VoiceGradeRequest {
  scenario: Scenario;
  line: Line;
  /** In-memory recording. Send it to the model call only; never store or log it. */
  audio: Blob;
  signal: AbortSignal;
}

export const unavailableSpeech: SpeechSource = () => Promise.reject(notConnected("Character voice"));
export const unavailableBackdrops: BackdropPainter = () => Promise.reject(notConnected("Backdrop painting"));
