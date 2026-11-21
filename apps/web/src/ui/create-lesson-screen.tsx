import { type FormEvent, useEffect, useRef, useState } from "react";
import { type GenerationStep, LESSON_PROMPT_MAX, type LibraryMatch, checkLessonPrompt } from "@scenespeak/core/lesson/generator";
import { languagesByInference } from "@scenespeak/core/language/language-filter";
import { DEFAULT_LESSON_LANGUAGE, type LessonLanguageCode, findLanguage } from "@scenespeak/core/language/languages";
import type { LessonOrigin } from "@scenespeak/core/lesson/lesson-origin";
import { type PlayableLesson, buildPlayableLesson } from "@scenespeak/core/lesson/playable-lesson";
import { CATALOG } from "@scenespeak/core/scene/catalog/catalog";
import { catalogAssetUrls, prefetchUrls } from "@scenespeak/core/scene/catalog/preload";
import { generateErrorMessage } from "./generate-error-message";
import { useServices } from "./services-context";

const EXAMPLES = ["Opening a bank account", "Asking a neighbour to borrow a ladder", "Checking in at a hotel", "Buying fruit at the market"];

type StepId = GenerationStep | "build";

const { onDevice, cloudOnly } = languagesByInference();
const LANGUAGE_GROUPS = [
  { id: "device", title: "On your device", note: "Graded privately by Gemini Nano when your browser has it.", languages: onDevice },
  { id: "cloud", title: "Cloud only", note: "On-device AI doesn't speak these yet.", languages: cloudOnly },
] as const;

// While the learner types their request, fetch the 3D code and models so the generated scene opens without waiting on them.
const warmScene = () => {
  void import("../scene/scene-view");
  prefetchUrls(catalogAssetUrls(CATALOG));
};

const STEPS: readonly { id: StepId; label: string; where: "device" | "cloud" | "local" }[] = [
  { id: "device-check", label: "Checking your request privately", where: "device" },
  { id: "library-check", label: "Looking for a lesson that already exists", where: "device" },
  { id: "cloud-write", label: "Writing the lesson", where: "cloud" },
  { id: "build", label: "Building the 3D scene", where: "local" },
];

const WHERE_LABEL = { device: "On your device", cloud: "Cloud", local: "In your browser" } as const;

type Status =
  | { kind: "editing" }
  | { kind: "working"; step: StepId }
  | { kind: "failed"; step: StepId; message: string }
  | { kind: "existing"; match: LibraryMatch; prompt: string };

export interface CreateLessonScreenProps {
  onReady: (lesson: PlayableLesson, origin: LessonOrigin) => void;
  /** Opens a published library lesson instead of writing a new one. */
  onPlayLibrary: (id: string) => void;
  onCancel: () => void;
}

export const CreateLessonScreen = ({ onReady, onPlayLibrary, onCancel }: CreateLessonScreenProps) => {
  const { generator } = useServices();
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState<LessonLanguageCode>(DEFAULT_LESSON_LANGUAGE);
  const chosen = findLanguage(language);
  const [status, setStatus] = useState<Status>({ kind: "editing" });
  const [inputError, setInputError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(warmScene, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const check = checkLessonPrompt(prompt);
    if (!check.ok) {
      setInputError(check.message);
      return;
    }
    setInputError(null);
    void run(check.prompt, true);
  };

  const run = async (request: string, allowExisting: boolean) => {
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
      const result = await generator({
        prompt: request,
        language,
        signal: current.signal,
        allowExisting,
        onProgress: (progress) => {
          if (!current.signal.aborted) advance(progress.step);
        },
      });
      if (current.signal.aborted) return;
      if (result.kind === "existing") {
        setStatus({ kind: "existing", match: result.match, prompt: request });
        return;
      }
      advance("build");
      const { lesson, topic, intents } = result;
      onReady({ ...buildPlayableLesson(lesson.scenario, lesson.recipe), backdrop: {} }, { kind: "generated", lesson, topic, intents });
    } catch (error) {
      if (current.signal.aborted) return;
      setStatus({ kind: "failed", step, message: generateErrorMessage(error) });
    }
  };

  const working = status.kind === "working";
  const activeIndex = status.kind === "working" || status.kind === "failed" ? STEPS.findIndex((s) => s.id === status.step) : -1;

  return (
    <section className="create" aria-labelledby="create-title">
      <div className="lesson-header">
        <button type="button" className="secondary small" onClick={onCancel}>
          ← Lessons
        </button>
        <h2 id="create-title">Create a lesson</h2>
      </div>

      <form className="card panel" onSubmit={submit} aria-busy={working}>
        <fieldset className="language-picker" disabled={working} aria-describedby="language-help">
          <legend className="field-label">Which language?</legend>
          {LANGUAGE_GROUPS.map((group) => (
            <div key={group.id} className="language-group" role="group" aria-labelledby={`language-group-${group.id}`}>
              <p id={`language-group-${group.id}`} className="language-group-title">
                <span className={`badge ${group.id === "device" ? "device" : "cloud"}`}>
                  <span aria-hidden="true">{group.id === "device" ? "🔒" : "☁️"}</span> {group.title}
                </span>{" "}
                {group.note}
              </p>
              <div className="language-options">
                {group.languages.map((option) => (
                  <label key={option.code} className={`language-option ${language === option.code ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="lesson-language"
                      value={option.code}
                      checked={language === option.code}
                      onChange={() => setLanguage(option.code)}
                    />
                    <span lang={option.code} className="language-native">
                      {option.nativeName}
                    </span>
                    <span className="language-english">{option.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <p id="language-help" className="audio-note" aria-live="polite">
            {chosen?.onDevice ? (
              <>
                <span className="badge device">On your device</span> {chosen.name} replies are graded privately by Gemini Nano when your browser has it.
              </>
            ) : (
              <>
                <span className="badge cloud">Cloud</span> On-device AI doesn't speak {chosen?.name ?? "this language"} yet, so its replies are graded in the cloud.
              </>
            )}
          </p>
        </fieldset>
        <label htmlFor="lesson-prompt" className="field-label">
          What do you want to be able to say? (English or {chosen?.name ?? "the language you're learning"})
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
          {prompt.length}/{LESSON_PROMPT_MAX}. Personal details are removed on your device, then your request goes to Google's Gemini to write the lesson.
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

      {status.kind === "existing" && (
        <div className="card panel existing-card" role="status">
          <h3>There's already a lesson for that!</h3>
          <p>
            <strong>{status.match.title}</strong> in the lesson library covers the same situation
            {status.match.votes > 0 && (
              <>
                {" "}
                and has <span aria-hidden="true">▲</span> {status.match.votes} {status.match.votes === 1 ? "upvote" : "upvotes"}
              </>
            )}
            . Playing it is instant and saves writing a new one in the cloud.
          </p>
          <div className="actions">
            <button type="button" className="big" onClick={() => onPlayLibrary(status.match.id)}>
              Play it
            </button>
            <button type="button" className="secondary" onClick={() => void run(status.prompt, false)}>
              Make mine anyway
            </button>
          </div>
        </div>
      )}

      {(status.kind === "working" || status.kind === "failed") && (
        <div className="card panel">
          <h3>Progress</h3>
          <ol className="steps" aria-live="polite">
            {STEPS.map((step, index) => {
              const state =
                index < activeIndex ? "done" : index > activeIndex ? "pending" : status.kind === "failed" ? "failed" : "active";
              // Languages Nano can't speak skip the device for these steps too.
              const where = step.where === "device" && !chosen?.onDevice ? "cloud" : step.where;
              return (
                <li key={step.id} className={`step ${state}`}>
                  <span className="step-mark" aria-hidden="true">
                    {state === "done" ? "✓" : state === "failed" ? "!" : index + 1}
                  </span>
                  <span>
                    {step.label} <span className={`badge ${where === "cloud" ? "cloud" : "device"}`}>{WHERE_LABEL[where]}</span>
                    <span className="visually-hidden"> ({state})</span>
                  </span>
                </li>
              );
            })}
            <li className="step pending">
              <span className="step-mark" aria-hidden="true">
                {STEPS.length + 1}
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
