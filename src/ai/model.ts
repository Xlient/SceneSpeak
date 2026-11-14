import {
  type GenerativeModel,
  type HybridParams,
  type InferenceSource,
  GoogleAIBackend,
  InferenceMode,
  getAI,
  getGenerativeModel,
} from "firebase/ai";
import { getFirebaseApp } from "./firebase";
import { withTimeout } from "./with-timeout";

export const DEFAULT_CLOUD_MODEL = "gemini-3.5-flash-lite";
export const DEFAULT_TIMEOUT_MS = 15_000;

export interface CreateModelOptions {
  cloudModel?: string;
  systemInstruction?: string;
  jsonSchema?: Record<string, unknown>;
  languages?: string[];          // default ["en", "es"]
  timeoutMs?: number;            
}
export interface CallOptions { timeoutMs?: number; signal?: AbortSignal }
export interface TextResult { text: string; source: InferenceSource | undefined }

export type ModelPort = Pick<GenerativeModel, "generateContent" | "initializeDeviceModel">;
export type ModelFactory = (params: HybridParams) => ModelPort;


export interface AppModel {
  mode: InferenceMode;
  generateText(prompt: string, options?: CallOptions): Promise<TextResult>;
}
export const firebaseFactory: ModelFactory = (params) =>
  getGenerativeModel(getAI(getFirebaseApp(), { backend: new GoogleAIBackend() }), params);

export const buildHybridParams = (mode: InferenceMode, options: CreateModelOptions = {}): HybridParams => {
  const languages = options.languages ?? ["en", "es"];
  const schema = options.jsonSchema;
  return {
    mode,
    inCloudParams: {
      model: options.cloudModel ?? DEFAULT_CLOUD_MODEL,
      ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
      ...(schema ? { generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema } } : {}),
    },
    onDeviceParams: {
      createOptions: {
        expectedInputs: [{ type: "text", languages }],
        expectedOutputs: [{ type: "text", languages }],
      },
      ...(schema ? { promptOptions: { responseConstraint: schema } } : {}),
    },
  };
};

export const createModel =  (mode: InferenceMode, options: CreateModelOptions = {}, factory: ModelFactory = firebaseFactory): AppModel => 
    {
        const params = buildHybridParams(mode, options);
        const modelPort = factory(params);
        return {
            mode: mode,
            async generateText(prompt: string, callOptions: CallOptions = {}): Promise<TextResult> {
                const timeoutMs = callOptions.timeoutMs ?? options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
                const result = await withTimeout(
                    (signal) => modelPort.generateContent(prompt, { signal, timeout: timeoutMs }),
                { timeoutMs, signal: callOptions.signal });
                return { text: result.response.text(), source: result.response.inferenceSource };
            },
        };
    
    

}
