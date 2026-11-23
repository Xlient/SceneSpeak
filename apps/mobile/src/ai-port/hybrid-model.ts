import { z } from "zod";
import { NotConnectedError } from "@scenespeak/core/services/not-connected";

// The contract the native on-device path implements (Kotlin module on Android, Swift on iOS).
// Values mirror firebase/ai's InferenceMode so the routing policy can pass its decision straight through.
export const INFERENCE_MODES = ["prefer_on_device", "only_on_device", "prefer_in_cloud", "only_in_cloud"] as const;
export type InferenceMode = (typeof INFERENCE_MODES)[number];

export const DeviceModelStatus = z.enum(["unavailable", "downloadable", "downloading", "available"]);
export type DeviceModelStatus = z.infer<typeof DeviceModelStatus>;

export const DeviceModelInfo = z.object({
  status: DeviceModelStatus.catch("unavailable"),
  /** e.g. "gemini-nano" or "apple-foundation"; absent when unknown. */
  modelName: z.string().max(80).optional(),
  /** Plain-language reason for the Model Monitor, e.g. "Apple Intelligence is off". */
  reason: z.string().max(200).optional(),
  /** Download progress from 0 to 1 while downloading, when the platform knows it. */
  progress: z
    .number()
    .transform((n) => Math.min(1, Math.max(0, n)))
    .optional()
    .catch(undefined),
});
export type DeviceModelInfo = z.infer<typeof DeviceModelInfo>;

/** Native results cross the bridge as untrusted JSON: parse with this before use. */
export const GenerateResult = z.object({
  text: z.string(),
  inferenceSource: z.enum(["on_device", "in_cloud"]),
  latencyMs: z.number().nonnegative(),
});
export type GenerateResult = z.infer<typeof GenerateResult>;

/** JSON shapes the native side can produce on device (Android: one @Generable class each). */
export const SCHEMA_IDS = ["grade", "voice-grade", "screen", "match", "lesson"] as const;
export type SchemaId = (typeof SCHEMA_IDS)[number];

/** A recorded reply, base64 in memory only for the call. Never stored or logged. */
export interface InlineAudio {
  mimeType: string;
  data: string;
}

export interface GenerateRequest {
  prompt: string;
  mode: InferenceMode;
  systemInstruction?: string;
  /** JSON output. Cloud calls can use `responseSchema` as-is; on-device calls need the native class for `schemaId`. */
  schemaId?: SchemaId;
  responseSchema?: Readonly<Record<string, unknown>>;
  /** Audio part sent with the prompt (cloud only: on-device models don't take audio). */
  audio?: InlineAudio;
}

export interface CallOptions {
  signal: AbortSignal;
  timeoutMs: number;
}

export interface DownloadOptions extends CallOptions {
  /** Each status seen while the download runs. */
  onUpdate?: (info: DeviceModelInfo) => void;
}

export interface HybridModel {
  status(options: CallOptions): Promise<DeviceModelInfo>;
  /** Android starts the Gemini Nano download; iOS can't (the OS owns the model) and resolves with the status. */
  download(options: DownloadOptions): Promise<DeviceModelInfo>;
  /** Optional latency win before the first call; resolves when done or unsupported. */
  warmUp(options: CallOptions): Promise<void>;
  generate(request: GenerateRequest, options: CallOptions): Promise<GenerateResult>;
}

/** A "not connected" stub error, so the Model Monitor skips it like the web app's stubs. */
export class HybridModelUnavailableError extends NotConnectedError {
  override readonly name = "HybridModelUnavailableError";
}
