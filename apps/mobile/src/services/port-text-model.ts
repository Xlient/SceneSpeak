import type { TextModel } from "@scenespeak/core/ai/lesson-generator";
import { type HybridModel, type InferenceMode, type SchemaId, GenerateResult } from "../ai-port/hybrid-model";

export interface PortModelOptions {
  systemInstruction: string;
  schemaId: SchemaId;
  responseSchema: Readonly<Record<string, unknown>>;
  timeoutMs: number;
}

/** Adapts the native HybridModel port to the `generateText` shape core's graders and generators call. */
export const createPortTextModel = (port: HybridModel, mode: InferenceMode, options: PortModelOptions): TextModel => ({
  generateText: async (prompt, call = {}) => {
    const raw: unknown = await port.generate(
      { prompt, mode, systemInstruction: options.systemInstruction, schemaId: options.schemaId, responseSchema: options.responseSchema },
      { signal: call.signal ?? new AbortController().signal, timeoutMs: call.timeoutMs ?? options.timeoutMs },
    );
    const result = GenerateResult.parse(raw);
    return { text: result.text, source: result.inferenceSource };
  },
});
