/** Gemini's audio formats that phones can record directly (Android: AAC/ADTS, iOS: 16-bit WAV). */
const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  aac: "audio/aac",
  wav: "audio/wav",
};

/** The MIME type for a recording file, or undefined for a format Gemini can't take. */
export const recordingMimeType = (uri: string): string | undefined => {
  const extension = uri.split(/[?#]/)[0]?.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension];
};
