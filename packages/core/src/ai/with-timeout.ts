export class AiTimeoutError extends Error {
  override readonly name = "AiTimeoutError";

  constructor(readonly timeoutMs: number) {
    super(`AI call timed out after ${timeoutMs} ms`);
  }
}

export class AiAbortedError extends Error {
  override readonly name = "AiAbortedError";

  constructor() {
    super("AI call was cancelled");
  }
}

export interface TimeoutOptions {
  timeoutMs: number;
  signal?: AbortSignal | undefined;
}

export const withTimeout = <T>(
  run: (signal: AbortSignal) => Promise<T>,
  { timeoutMs, signal }: TimeoutOptions,
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AiAbortedError());
      return;
    }

    const controller = new AbortController();
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    };

    const timer = setTimeout(() => {
      cleanup();
      controller.abort();
      reject(new AiTimeoutError(timeoutMs));
    }, timeoutMs);

    const onAbort = () => {
      cleanup();
      controller.abort();
      reject(new AiAbortedError());
    };
    signal?.addEventListener("abort", onAbort);

    run(controller.signal).then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
  });
