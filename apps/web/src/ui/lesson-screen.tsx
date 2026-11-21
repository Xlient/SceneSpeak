import { type FormEvent, Suspense, lazy, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { backdropCacheKey } from "@scenespeak/core/cache/blob-cache";
import { sharedBackdropKey } from "@scenespeak/core/cache/shared-key";
import { BACKDROP_MODEL } from "@scenespeak/core/services/live-backdrops";
import { LESSON_MODES, type LessonMode, MODE_SETTINGS } from "@scenespeak/core/lesson/lesson-mode";
import { characterAnimation, currentLine, initialLessonState, lessonReducer } from "@scenespeak/core/lesson/lesson-progress";
import type { PlayableLesson } from "@scenespeak/core/lesson/playable-lesson";
import { scoreLesson } from "@scenespeak/core/lesson/scoring";
import { languageName } from "@scenespeak/core/language/languages";
import { LEARNER_SPEAKER } from "@scenespeak/core/schemas";
import { FeedbackCard } from "./feedback-card";
import { BreakdownCard } from "./breakdown-card";
import { LessonSummary } from "./lesson-summary";
import { SceneBubble } from "./scene-bubble";
import { VoicePicker } from "./voice-picker";
import { useBreakdown } from "./use-breakdown";
import { gradeErrorMessage } from "./grade-error-message";
import { useServices } from "./services-context";
import { useGeneratedMedia } from "./use-object-url";
import { VoiceReply } from "./voice-reply";

// three.js and the models load in their own chunk, after the lesson UI is on screen.
const SceneView = lazy(() => import("../scene/scene-view").then((m) => ({ default: m.SceneView })));

type Attempt = { kind: "text"; reply: string } | { kind: "voice"; audio: Blob };

export interface LessonScreenProps {
  lesson: PlayableLesson;
  initialMode?: LessonMode;
  onExit: () => void;
  /** Called once when the learner reaches the end of the lesson. */
  onComplete?: (result: { lessonId: string; goalsDone: number; goalsTotal: number; speaking: boolean; xp: number }) => void;
}

const useBackdrop = (lesson: PlayableLesson): { url?: string } | undefined => {
  const { backdrops } = useServices();
  const { scenario } = lesson;
  const wanted = lesson.backdrop !== undefined && lesson.backdrop.url === undefined;
  const { room, gradient } = lesson.manifest;
  const key = backdropCacheKey(scenario.id, scenario.setting, room);
  const load = useCallback(
    async (signal: AbortSignal) => {
      const theme = { room, gradient };
      // Content-addressed, so the same scene is reused across lessons and users.
      const cacheKey = await sharedBackdropKey({ setting: scenario.setting, theme, model: BACKDROP_MODEL });
      return backdrops({ cacheKey, setting: scenario.setting, theme, signal });
    },
    [backdrops, key, scenario.setting, room, gradient],
  );
  const media = useGeneratedMedia(wanted ? load : null, key);
  if (!lesson.backdrop) return undefined;
  if (lesson.backdrop.url) return { url: lesson.backdrop.url };
  return media.status === "ready" ? { url: media.url } : {};
};

export const LessonScreen = ({ lesson, initialMode = "typing", onExit, onComplete }: LessonScreenProps) => {
  const { scenario, manifest } = lesson;
  const languageLabel = languageName(scenario.language);
  const { grader, voiceGrader, speechConnected } = useServices();
  const reducer = useMemo(() => lessonReducer(scenario), [scenario]);
  const [state, dispatch] = useReducer(reducer, scenario, initialLessonState);
  const [reply, setReply] = useState("");
  const [mode, setMode] = useState<LessonMode>(initialMode);
  const settings = MODE_SETTINGS[mode];
  const [showTranslation, setShowTranslation] = useState(settings.showTranslation);
  const [autoPlay, setAutoPlay] = useState(settings.autoPlay);
  const [useVoice, setUseVoice] = useState(false);
  const voiceFirst = settings.voiceFirst;
  const completed = useRef(false);
  useEffect(() => {
    if (state.phase !== "done" || completed.current) return;
    completed.current = true;
    const speaking = mode === "speaking";
    const { xp } = scoreLesson(scenario, state.attempts, { speaking });
    onComplete?.({ lessonId: scenario.id, goalsDone: state.completedGoalIds.length, goalsTotal: scenario.goals.length, speaking, xp });
  }, [state.phase, onComplete, scenario, state.completedGoalIds, state.attempts, mode]);
  const score = state.phase === "done" ? scoreLesson(scenario, state.attempts, { speaking: mode === "speaking" }) : undefined;
  const changeMode = (next: LessonMode) => {
    setMode(next);
    setShowTranslation(MODE_SETTINGS[next].showTranslation);
    setAutoPlay(MODE_SETTINGS[next].autoPlay);
  };
  const attempt = useRef<Attempt | null>(null);
  const line = currentLine(scenario, state);
  const backdrop = useBackdrop(lesson);
  const breakdown = useBreakdown(line?.text ?? "", scenario.language, line?.translation ?? "");
  const canExplain = line !== undefined;
  const speakerName = (id: string) => scenario.cast.find((member) => member.characterId === id)?.name ?? id;

  useEffect(() => {
    const current = attempt.current;
    if (state.phase !== "grading" || !line || !current) return;
    const controller = new AbortController();
    const request = { scenario, line, signal: controller.signal };
    const grading =
      current.kind === "text" ? grader({ ...request, reply: current.reply }) : voiceGrader({ ...request, audio: current.audio });
    // Drop the recording as soon as it's handed off.
    attempt.current = null;
    grading.then(
      (result) => dispatch({ type: "graded", result }),
      (error: unknown) => {
        if (!controller.signal.aborted) {
          dispatch({ type: "gradeFailed", message: gradeErrorMessage(error) });
        }
      },
    );
    return () => controller.abort();
  }, [state.phase, line, grader, voiceGrader, scenario]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!reply.trim()) return;
    attempt.current = { kind: "text", reply };
    dispatch({ type: "submit" });
  };

  const submitVoice = useCallback((audio: Blob) => {
    attempt.current = { kind: "voice", audio };
    dispatch({ type: "submit" });
  }, []);

  const goNext = () => {
    setReply("");
    dispatch({ type: "continue" });
  };

  const typedReply = (
    <form onSubmit={submit}>
      <label htmlFor="reply-input">Your reply in {languageLabel}</label>
      <div className="reply-row">
        <input
          id="reply-input"
          type="text"
          lang={scenario.language}
          autoComplete="off"
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          disabled={state.phase === "grading"}
        />
        <button type="submit" disabled={state.phase === "grading" || !reply.trim()}>
          {state.phase === "grading" ? "Checking…" : "Send"}
        </button>
      </div>
    </form>
  );
  const replyError = state.error && (
    <p className="error" role="alert">
      {state.error}
    </p>
  );

  return (
    <section className="lesson" aria-labelledby="lesson-title">
      <div className="lesson-header">
        <button type="button" className="secondary small" onClick={onExit}>
          ← Lessons
        </button>
        <h2 id="lesson-title">{scenario.title}</h2>
        <fieldset className="mode-switch">
          <legend className="visually-hidden">Lesson mode</legend>
          {LESSON_MODES.map((id) => (
            <label key={id} className={`mode-option ${mode === id ? "active" : ""}`}>
              <input type="radio" name="lesson-mode" value={id} checked={mode === id} onChange={() => changeMode(id)} />
              <span aria-hidden="true">{MODE_SETTINGS[id].icon}</span> {MODE_SETTINGS[id].label}
            </label>
          ))}
        </fieldset>
        <span className="pill">{languageLabel} · {scenario.level}</span>
      </div>

      <div className="card scene-stage">
        <Suspense fallback={<div className="scene scene-fallback" role="status">Loading the 3D scene…</div>}>
          <SceneView manifest={manifest} animation={characterAnimation(scenario, state)} backdrop={backdrop} />
        </Suspense>
        {line && (
          <SceneBubble
            key={line.id}
            lessonId={scenario.id}
            line={line}
            speakerName={speakerName(line.speaker)}
            language={scenario.language}
            showTranslation={showTranslation}
            autoPlay={autoPlay && state.phase === "listening"}
            onEnded={settings.autoAdvance && autoPlay && state.phase === "listening" ? () => dispatch({ type: "next" }) : undefined}
            breakdown={canExplain && breakdown.state.status === "ready" ? breakdown.state.breakdown : undefined}
            onExplain={canExplain ? breakdown.request : undefined}
            explaining={breakdown.state.status === "loading"}
          />
        )}
      </div>

      <div className="card panel">
        <div>
          <h3>Goals</h3>
          <ul className="goals">
            {scenario.goals.map((goal) => {
              const done = state.completedGoalIds.includes(goal.id);
              return (
                <li key={goal.id} className={`goal ${done ? "done" : ""}`}>
                  {done ? "✓ " : ""}
                  {goal.description}
                  <span className="visually-hidden">{done ? " (done)" : " (to do)"}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="toggles">
          <label className="toggle">
            <input type="checkbox" checked={showTranslation} onChange={(event) => setShowTranslation(event.target.checked)} />
            <span>Show English</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={autoPlay} onChange={(event) => setAutoPlay(event.target.checked)} />
            <span>Play voices</span>
          </label>
          {!voiceFirst && (
            <label className="toggle">
              <input type="checkbox" checked={useVoice} onChange={(event) => setUseVoice(event.target.checked)} />
              <span>Reply by voice (cloud)</span>
            </label>
          )}
        </div>

        <VoicePicker language={scenario.language} cloudAvailable={speechConnected} />

        {canExplain && <BreakdownCard state={breakdown.state} />}

        {state.phase === "listening" && (
          <div className="actions">
            <button type="button" onClick={() => dispatch({ type: "next" })}>
              Next
            </button>
          </div>
        )}

        {(state.phase === "replying" || state.phase === "grading") &&
          (voiceFirst ? (
            <div className="reply speaking-reply">
              <p className="speaking-prompt">Say it out loud in {languageLabel}</p>
              <VoiceReply primary disabled={state.phase === "grading"} onRecorded={submitVoice} />
              {state.phase === "grading" && (
                <p className="audio-note" role="status">
                  Listening to your answer…
                </p>
              )}
              {replyError}
              <details className="type-instead">
                <summary>Type instead</summary>
                {typedReply}
              </details>
            </div>
          ) : (
            <div className="reply">
              {typedReply}
              {replyError}
              {useVoice && <VoiceReply disabled={state.phase === "grading"} onRecorded={submitVoice} />}
            </div>
          ))}

        {state.phase === "feedback" && state.lastResult && (
          <>
            <div aria-live="polite">
              <FeedbackCard result={state.lastResult} language={scenario.language} />
            </div>
            <div className="actions">
              {!state.lastResult.grade.ok && (
                <button type="button" className="warm" onClick={() => dispatch({ type: "retry" })}>
                  Try again
                </button>
              )}
              <button type="button" className={state.lastResult.grade.ok ? "" : "secondary"} onClick={goNext}>
                {state.lastResult.grade.ok ? "Continue" : "Skip"}
              </button>
            </div>
          </>
        )}

        {score && <LessonSummary score={score} language={scenario.language} onExit={onExit} />}
      </div>
    </section>
  );
};
