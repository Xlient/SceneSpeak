import { withTimeout } from "@scenespeak/core/ai/with-timeout";
import { z } from "zod";
import { type DeviceModelInfo, type HybridModel, DeviceModelInfo as DeviceModelInfoSchema, GenerateResult, HybridModelUnavailableError } from "./hybrid-model";

/** The Kotlin module's surface (modules/hybrid-ai). Every function takes the native timeout last. */
export interface NativeHybridAi {
  status(timeoutMs: number): Promise<unknown>;
  download(timeoutMs: number): Promise<unknown>;
  warmUp(timeoutMs: number): Promise<unknown>;
  generate(request: Record<string, unknown>, timeoutMs: number): Promise<unknown>;
}

const NativeError = z.object({ code: z.string() });
const POLL_MS = 2_000;

const toInfo = (raw: unknown): DeviceModelInfo => {
  const parsed = DeviceModelInfoSchema.safeParse(raw);
  return parsed.success ? parsed.data : { status: "unavailable", reason: "On-device AI sent an unexpected answer." };
};

// A build without google-services.json can't reach Firebase: report it like the other "not connected" stubs.
const mapError = (error: unknown): unknown => {
  const parsed = NativeError.safeParse(error);
  if (parsed.success && parsed.data.code === "ERR_NOT_CONFIGURED") {
    return new HybridModelUnavailableError(error instanceof Error ? error.message : "Firebase isn't set up in this build.");
  }
  return error;
};

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    });
  });

/**
 * HybridModel over the native module. The JS side races every call against the caller's signal and timeout
 * (the bridge can't cancel a running call); the native side gets the same timeout so it stops too.
 */
export const createNativeModel = (native: NativeHybridAi, pollMs = POLL_MS): HybridModel => {
  const run = <T>(call: (timeoutMs: number) => Promise<T>, { signal, timeoutMs }: { signal: AbortSignal; timeoutMs: number }) =>
    withTimeout(() => call(timeoutMs).catch((error: unknown) => Promise.reject(mapError(error))), { signal, timeoutMs });

  return {
    status: async (options) => toInfo(await run((ms) => native.status(ms), options)),

    // The native download runs in the background; poll until it settles so the tour sees "available".
    download: (options) =>
      run(async (ms) => {
        const deadline = Date.now() + ms;
        let info = toInfo(await native.download(ms));
        while (info.status === "downloading" && Date.now() + pollMs < deadline && !options.signal.aborted) {
          await sleep(pollMs, options.signal);
          info = toInfo(await native.status(Math.max(1, deadline - Date.now())));
        }
        return info;
      }, options),

    warmUp: async (options) => {
      await run((ms) => native.warmUp(ms), options);
    },

    generate: async (request, options) => {
      const { prompt, mode, systemInstruction, schemaId, responseSchema, audio } = request;
      const payload: Record<string, unknown> = { prompt, mode };
      if (systemInstruction !== undefined) payload.systemInstruction = systemInstruction;
      if (schemaId !== undefined) payload.schemaId = schemaId;
      if (responseSchema !== undefined) payload.responseSchema = responseSchema;
      if (audio !== undefined) payload.audio = audio;
      return GenerateResult.parse(await run((ms) => native.generate(payload, ms), options));
    },
  };
};

/** The module as loaded at runtime, or null when this platform's module doesn't implement the functions yet (iOS). */
export const asNativeHybridAi = (module: unknown): NativeHybridAi | null => {
  if (typeof module !== "object" || module === null) return null;
  const candidate = module as Partial<Record<keyof NativeHybridAi, unknown>>;
  const names: readonly (keyof NativeHybridAi)[] = ["status", "download", "warmUp", "generate"];
  return names.every((name) => typeof candidate[name] === "function") ? (module as NativeHybridAi) : null;
};
