import { type FormEvent, useEffect, useRef, useState } from "react";
import { type GenerationStep, LESSON_PROMPT_MAX, checkLessonPrompt } from "../lesson/generator";
import { type PlayableLesson, buildPlayableLesson } from "../lesson/playable-lesson";
import { CATALOG } from "../scene/catalog/catalog";
import { catalogAssetUrls, prefetchUrls } from "../scene/catalog/preload";
import { generateErrorMessage } from "./generate-error-message";
import { useServices } from "./services-context";

const EXAMPLES = ["Opening a bank account", "Asking a neighbour to borrow a ladder", "Checking in at a hotel", "Buying fruit at the market"];

type StepId = GenerationStep | "build";

// While the learner types their request, fetch the 3D code and models so the generated scene opens without waiting on them.
const warmScene = () => {
  void import("../scene/scene-view");
  prefetchUrls(catalogAssetUrls(CATALOG));
};

const STEPS: readonly { id: StepId; label: string; where: "device" | "cloud" | "local" }[] = [
  { id: "device-check", label: "Checking your request privately", where: "device" },
  { id: "cloud-write", label: "Writing the lesson", where: "cloud" },
  { id: "build", label: "Building the 3D scene", where: "local" },
];

const WHERE_LABEL = { device: "On your device", cloud: "Cloud", local: "In your browser" } as const;

type Status = { kind: "editing" } | { kind: "working"; step: StepId } | { kind: "failed"; step: StepId; message: string };

export interface CreateLessonScreenProps {
  onReady: (lesson: PlayableLesson) => void;
  onCancel: () => void;
}

export const CreateLessonScreen = ({ onReady, onCancel }: CreateLessonScreenProps) => {
  const { generator } = useServices();
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "editing" });
  const [inputError, setInputError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(warmScene, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const check = checkLessonPrompt(prompt);
    if (!check.ok) {
      setInputError(check.message);
      return;
    }
    setInputError(null);
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    let step: StepId = "device-check";
    const advance = (next: StepId) => {
      step = next;
      setStatus({ kind: "working", step: next });
    };
    advance("device-check");
    try {
      const generated = await generator({
        prompt: check.prompt,
        language: "es",
        signal: current.signal,
        onProgress: (progress) => {
          if (!current.signal.aborted) advance(progress.step);
        },
      });
      if (current.signal.aborted) return;
      advance("build");
      onReady({ ...buildPlayableLesson(generated.scenario, generated.recipe), backdrop: {} });
    } catch (error) {
      if (current.signal.aborted) return;
      setStatus({ kind: "failed", step, message: generateErrorMessage(error) });
    }
  };

  const working = status.kind === "working";
  const activeIndex = status.kind === "editing" ? -1 : STEPS.findIndex((s) => s.id === status.step);

  return (
    <section className="create" aria-labelledby="create-title">
      <div className="lesson-header">
        <button type="button" className="secondary small" onClick={onCancel}>
          ← Lessons
        </button>
        <h2 id="create-title">Create a lesson</h2>
      </div>

      <form className="card panel" onSubmit={submit} aria-busy={working}>
        <label htmlFor="lesson-prompt" className="field-label">
          What do you want to be able to say? (English or Spanish)
        </label>
        <textarea
          id="lesson-prompt"
          rows={3}
          maxLength={LESSON_PROMPT_MAX}
          value={prompt}
          disabled={working}
          aria-describedby="prompt-help"
          aria-invalid={inputError !== null}
          onChange={(event) => setPrompt(event.target.value)}
        />
        <p id="prompt-help" className="audio-note">
          {prompt.length}/{LESSON_PROMPT_MAX}. Personal details are removed on your device before anything goes to the cloud.
        </p>
        {inputError && (
          <p className="error" role="alert">
            {inputError}
          </p>
        )}
        <div className="chips" role="group" aria-label="Examples">
          {EXAMPLES.map((example) => (
            <button key={example} type="button" className="chip" disabled={working} onClick={() => setPrompt(example)}>
              {example}
            </button>
          ))}
        </div>
        <div className="actions">
          <button type="submit" className="big" disabled={working}>
            {working ? "Building…" : "✨ Build my lesson"}
          </button>
        </div>
      </form>

      {status.kind !== "editing" && (
        <div className="card panel">
          <h3>Progress</h3>
          <ol className="steps" aria-live="polite">
            {STEPS.map((step, index) => {
              const state =
                index < activeIndex ? "done" : index > activeIndex ? "pending" : status.kind === "failed" ? "failed" : "active";
              return (
                <li key={step.id} className={`step ${state}`}>
                  <span className="step-mark" aria-hidden="true">
                    {state === "done" ? "✓" : state === "failed" ? "!" : index + 1}
                  </span>
                  <span>
                    {step.label} <span className={`badge ${step.where === "cloud" ? "cloud" : "device"}`}>{WHERE_LABEL[step.where]}</span>
                    <span className="visually-hidden"> ({state})</span>
                  </span>
                </li>
              );
            })}
            <li className="step pending">
              <span className="step-mark" aria-hidden="true">
                4
              </span>
              <span>
                Painting the backdrop, while you play <span className="badge cloud">Cloud</span>
              </span>
            </li>
          </ol>
          {status.kind === "failed" && (
            <>
              <p className="error" role="alert">
                {status.message}
              </p>
              <div className="actions">
                <button type="button" className="secondary" onClick={onCancel}>
                  Try a featured lesson
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};
