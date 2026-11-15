/** Speech-quality target: 16 kHz mono keeps a 15 s reply under ~0.5 MB. */
export const VOICE_SAMPLE_RATE = 16_000;

/** Encodes mono samples (-1..1) as a 16-bit PCM WAV file. */
export const encodeWav = (samples: Float32Array, sampleRate: number): Uint8Array<ArrayBuffer> => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    view.setInt16(44 + i * 2, Math.round(clamped * 0x7fff), true);
  }
  return new Uint8Array(buffer);
};

export const toBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  // Chunked: spreading a large array into String.fromCharCode overflows the stack.
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

export interface InlineAudio {
  mimeType: string;
  /** Base64, held in memory only for the model call. */
  data: string;
}

export type AudioEncoder = (audio: Blob) => Promise<InlineAudio>;

const decodeToMono = async (audio: Blob): Promise<Float32Array> => {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await audio.arrayBuffer());
    const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * VOICE_SAMPLE_RATE)), VOICE_SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    return (await offline.startRendering()).getChannelData(0);
  } finally {
    void context.close();
  }
};

/**
 * Browsers record WebM/Opus, which Gemini doesn't list as an audio format, so the reply is re-encoded as WAV.
 * If decoding fails, the original recording is sent as it is.
 */
export const encodeVoiceReply: AudioEncoder = async (audio) => {
  try {
    return { mimeType: "audio/wav", data: toBase64(encodeWav(await decodeToMono(audio), VOICE_SAMPLE_RATE)) };
  } catch {
    const mimeType = audio.type.split(";")[0] || "audio/webm";
    return { mimeType, data: toBase64(new Uint8Array(await audio.arrayBuffer())) };
  }
};
