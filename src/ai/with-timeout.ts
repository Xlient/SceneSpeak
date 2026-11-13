export class AiTimeoutError extends Error { /* keep timeoutMs on it */ }
export class AiAbortedError extends Error {}

export interface TimeoutOptions { timeoutMs: number; signal?: AbortSignal | undefined }

export const withTimeout = <T>(
  run: (signal: AbortSignal) => Promise<T>,
  options: TimeoutOptions,
): Promise<T>
