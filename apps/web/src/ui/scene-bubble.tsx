import type { SentenceBreakdown } from "@scenespeak/core/lesson/sentence-breakdown";
import { LEARNER_SPEAKER, type Line } from "@scenespeak/core/schemas";
import { SentenceText } from "./sentence-text";
import { SpeakButton } from "./speak-button";
import { usePronunciation } from "./use-pronunciation";

export interface SceneBubbleProps {
  lessonId: string;
  line: Line;
  speakerName: string;
  language: string;
  showTranslation: boolean;
  autoPlay: boolean;
  onEnded?: (() => void) | undefined;
  breakdown?: SentenceBreakdown | undefined;
  /** Shown when a breakdown may be requested for this line. */
  onExplain?: (() => void) | undefined;
  explaining: boolean;
}

/** The current line as a speech bubble over the 3D scene, with its pronunciation one click away. */
export const SceneBubble = ({ lessonId, line, speakerName, language, showTranslation, autoPlay, onEnded, breakdown, onExplain, explaining }: SceneBubbleProps) => {
  const learner = line.speaker === LEARNER_SPEAKER;
  const voice = usePronunciation({
    lessonId,
    lineId: line.id,
    speaker: line.speaker,
    text: line.text,
    language,
    autoPlay: autoPlay && !learner,
    ...(onEnded ? { onEnded } : {}),
  });

  return (
    <div className={`scene-bubble ${learner ? "learner" : "character"}`} aria-live="polite">
      <span className="speaker">{learner ? "Your turn · say or type" : speakerName}</span>
      <p className="line-text">
        <SentenceText text={line.text} language={language} {...(breakdown ? { breakdown } : {})} />
      </p>
      {/* Learners always see what their line means; character lines follow the Show English toggle. */}
      {(learner || showTranslation) && (
        <p className="line-translation" lang="en">
          {line.translation}
        </p>
      )}
      <div className="bubble-actions">
        <SpeakButton
          text={line.text}
          label={learner ? "Hear it" : "Listen"}
          source={voice.source}
          playing={voice.playing}
          onPlay={voice.play}
          onStop={voice.stop}
        />
        {onExplain && !breakdown && (
          <button type="button" className="speak-button" onClick={onExplain} disabled={explaining}>
            <span aria-hidden="true">🧩</span> {explaining ? "Thinking…" : "Grammar"}
          </button>
        )}
        {voice.source === "none" && <span className="bubble-note">No voice for this language on this device.</span>}
      </div>
    </div>
  );
};
