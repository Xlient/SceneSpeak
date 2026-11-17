import { useCallback, useEffect, useRef, useState } from "react";
import type { InferenceSource } from "@scenespeak/core/lesson/grader";
import type { SentenceBreakdown } from "@scenespeak/core/lesson/sentence-breakdown";
import { NotConnectedError } from "@scenespeak/core/services/not-connected";
import { useServices } from "./services-context";

export type BreakdownState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; breakdown: SentenceBreakdown; source: InferenceSource }
  | { status: "failed"; message: string };

// Memory only, per visit: lines repeat when a learner retries or replays a lesson.
const cache = new Map<string, { breakdown: SentenceBreakdown; source: InferenceSource }>();

export const useBreakdown = (text: string, language: string, translation: string) => {
  const { explainer } = useServices();
  const key = `${language}\u0000${text}`;
  const cached = cache.get(key);
  const [state, setState] = useState<{ key: string; value: BreakdownState }>({ key, value: { status: "idle" } });
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), [key]);

  const request = useCallback(() => {
    if (cache.has(key)) return;
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setState({ key, value: { status: "loading" } });
    explainer({ text, language, translation, signal: current.signal }).then(
      (result) => {
        cache.set(key, result);
        if (!current.signal.aborted) setState({ key, value: { status: "ready", ...result } });
      },
      (error: unknown) => {
        if (current.signal.aborted) return;
        const message = error instanceof NotConnectedError ? error.message : "Couldn't break this sentence down. Try again.";
        setState({ key, value: { status: "failed", message } });
      },
    );
  }, [explainer, key, text, language, translation]);

  const value: BreakdownState = cached ? { status: "ready", ...cached } : state.key === key ? state.value : { status: "idle" };
  return { state: value, request };
};
