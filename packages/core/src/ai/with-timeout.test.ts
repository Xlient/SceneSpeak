import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiAbortedError, AiTimeoutError, withTimeout } from "./with-timeout";

// A call that never finishes on its own, but rejects once its signal aborts, like a real fetch.
const hang = (signal: AbortSignal) =>
  new Promise<string>((_, reject) => {
    signal.addEventListener("abort", () => reject(new Error("inner abort")));
  });

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves with the call's value when it finishes in time", async () => {
    await expect(withTimeout(async () => "done", { timeoutMs: 100 })).resolves.toBe("done");
  });

  it("rejects with AiTimeoutError after timeoutMs and aborts the call's signal", async () => {
    let callSignal: AbortSignal | undefined;
    const promise = withTimeout(
      (signal) => {
        callSignal = signal;
        return hang(signal);
      },
      { timeoutMs: 100 },
    );

    vi.advanceTimersByTime(99);
    expect(callSignal?.aborted).toBe(false);

    vi.advanceTimersByTime(1);
    await expect(promise).rejects.toBeInstanceOf(AiTimeoutError);
    expect(callSignal?.aborted).toBe(true);
  });

  it("keeps timeoutMs on the timeout error", async () => {
    const promise = withTimeout(hang, { timeoutMs: 250 });
    vi.advanceTimersByTime(250);
    await expect(promise).rejects.toMatchObject({ timeoutMs: 250 });
  });

  it("rejects with AiAbortedError when the caller aborts mid-call", async () => {
    const controller = new AbortController();
    let callSignal: AbortSignal | undefined;
    const promise = withTimeout(
      (signal) => {
        callSignal = signal;
        return hang(signal);
      },
      { timeoutMs: 1000, signal: controller.signal },
    );

    controller.abort();
    await expect(promise).rejects.toBeInstanceOf(AiAbortedError);
    expect(callSignal?.aborted).toBe(true);
  });

  it("rejects immediately and never starts the call when the signal is already aborted", async () => {
    const run = vi.fn(hang);
    await expect(withTimeout(run, { timeoutMs: 1000, signal: AbortSignal.abort() })).rejects.toBeInstanceOf(
      AiAbortedError,
    );
    expect(run).not.toHaveBeenCalled();
  });

  it("passes the call's own error straight through", async () => {
    const error = new Error("model exploded");
    await expect(withTimeout(() => Promise.reject(error), { timeoutMs: 100 })).rejects.toBe(error);
  });

  it("clears the timer after the call finishes", async () => {
    await withTimeout(async () => "done", { timeoutMs: 100 });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops listening to the caller's signal after the call finishes", async () => {
    const controller = new AbortController();
    const removeSpy = vi.spyOn(controller.signal, "removeEventListener");
    await withTimeout(async () => "done", { timeoutMs: 100, signal: controller.signal });
    expect(removeSpy).toHaveBeenCalledWith("abort", expect.any(Function));
  });
});
