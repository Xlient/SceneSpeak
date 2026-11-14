import { useEffect, useRef, useState } from "react";
import { type CoachLessonOption, type CoachResult, validSuggestion } from "../progress/coach";
import type { WeeklySummary } from "../progress/weekly";
import { NotConnectedError } from "../services/not-connected";
import { useServices } from "./services-context";

type CoachState = { status: "idle" } | { status: "loading" } | { status: "ready"; result: CoachResult } | { status: "failed"; message: string };

export interface CoachCardProps {
  summary: WeeklySummary;
  language: string;
  lessons: readonly CoachLessonOption[];
  onPlay: (lessonId: string) => void;
}

/** Weekly recap written on device from local counts only; nothing about the learner leaves the browser. */
export const CoachCard = ({ summary, language, lessons, onPlay }: CoachCardProps) => {
  const { coach } = useServices();
  const [state, setState] = useState<CoachState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  const ask = () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setState({ status: "loading" });
    coach({ summary, language, lessons, signal: current.signal }).then(
      (result) => {
        if (!current.signal.aborted) setState({ status: "ready", result });
      },
      (error: unknown) => {
        if (current.signal.aborted) return;
        setState({ status: "failed", message: error instanceof NotConnectedError ? error.message : "The coach couldn't write a recap. Try again." });
      },
    );
  };

  const suggestion = state.status === "ready" ? validSuggestion(state.result.note, lessons) : undefined;

  return (
    <section className="card page-card coach-card" aria-labelledby="coach-title" aria-busy={state.status === "loading"}>
      <h3 id="coach-title">
        🧑‍🏫 Your coach <span className="badge device">On device · private</span>
      </h3>
      {state.status === "ready" ? (
        <div aria-live="polite">
          <p className="coach-recap">{state.result.note.recap}</p>
          <p className="coach-tip">💡 {state.result.note.tip}</p>
          {suggestion && (
            <button type="button" onClick={() => onPlay(suggestion.id)}>
              Try next: {suggestion.title}
            </button>
          )}
        </div>
      ) : (
        <>
          <p>Gemini Nano reads your week's practice on this device and writes a short recap with a next step. Your stats never leave the browser.</p>
          <button type="button" onClick={ask} disabled={state.status === "loading"}>
            {state.status === "loading" ? "Writing your recap…" : "Get my weekly recap"}
          </button>
          {state.status === "failed" && (
            <p className="audio-note" role="status">
              {state.message}
            </p>
          )}
        </>
      )}
    </section>
  );
};
