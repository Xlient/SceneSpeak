import type { BackdropPainter } from "../audio/media-sources";
import { buildBackdropPrompt } from "./backdrop-prompt";
import type { ModelPort } from "./model";
import { withTimeout } from "./with-timeout";

/** Image generation is slower than text; the gradient shows in the meantime. */
export const BACKDROP_TIMEOUT_MS = 60_000;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export class NoImageError extends Error {
  override readonly name = "NoImageError";

  constructor(reason: string | undefined) {
    super(`The model returned no image${reason ? ` (${reason})` : ""}.`);
  }
}

export type ImagePort = Pick<ModelPort, "generateContent">;

const decodeBase64 = (data: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

/** Model output is untrusted: only a real image of a known type and sane size becomes a Blob. */
export const createModelBackdropPainter =
  (port: ImagePort): BackdropPainter =>
  async (request) => {
    const prompt = buildBackdropPrompt(request);
    const result = await withTimeout((signal) => port.generateContent(prompt, { signal, timeout: BACKDROP_TIMEOUT_MS }), {
      timeoutMs: BACKDROP_TIMEOUT_MS,
      signal: request.signal,
    });
    const image = result.response.inlineDataParts()?.find((part) => IMAGE_TYPES.includes(part.inlineData.mimeType));
    if (!image) throw new NoImageError(result.response.candidates?.[0]?.finishReason);
    // base64 is 4 chars per 3 bytes, so this bounds the decoded size before decoding.
    if (image.inlineData.data.length > (MAX_IMAGE_BYTES / 3) * 4) throw new NoImageError("image too large");
    return new Blob([decodeBase64(image.inlineData.data)], { type: image.inlineData.mimeType });
  };
