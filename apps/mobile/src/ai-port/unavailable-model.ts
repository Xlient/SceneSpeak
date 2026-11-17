import { type HybridModel, HybridModelUnavailableError } from "./hybrid-model";

/** Stand-in until the native module is implemented: reports no device model and refuses calls. */
export const createUnavailableModel = (reason: string): HybridModel => {
  const info = { status: "unavailable" as const, reason };
  return {
    status: () => Promise.resolve(info),
    download: () => Promise.resolve(info),
    warmUp: () => Promise.resolve(),
    generate: () => Promise.reject(new HybridModelUnavailableError(reason)),
  };
};
