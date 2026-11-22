import { useId } from "react";
import { type SentenceBreakdown, linkWords } from "@scenespeak/core/lesson/sentence-breakdown";
import { splitWords } from "@scenespeak/core/language/word-split";

export interface WordPlayback {
  onPlay: (word: string, index: number) => void;
  playing: number | null;
}

/** Plain text, or each word as a button that says it aloud. */
const SpeakableText = ({ text, language, playback, offset }: { text: string; language: string; playback?: WordPlayback | undefined; offset: number }) => {
  if (!playback) return <>{text}</>;
  return (
    <>
      {splitWords(text, language).map((part, i) =>
        part.kind === "text" ? (
          <span key={i}>{part.text}</span>
        ) : (
          <button
            key={i}
            type="button"
            className={`word-say ${playback.playing === offset + i ? "playing" : ""}`}
            aria-label={`Hear “${part.text}”`}
            onClick={() => playback.onPlay(part.text, offset + i)}
          >
            {part.text}
          </button>
        ),
      )}
    </>
  );
};

/**
 * The line itself. Words can be tapped to hear them alone; once broken down, each word also shows its grammar role
 * on hover or focus.
 */
export const SentenceText = ({ text, language, breakdown, playback }: { text: string; language: string; breakdown?: SentenceBreakdown; playback?: WordPlayback | undefined }) => {
  const baseId = useId();
  if (!breakdown)
    return (
      <span lang={language}>
        <SpeakableText text={text} language={language} playback={playback} offset={0} />
      </span>
    );
  return (
    <span lang={language}>
      {linkWords(text, breakdown.words).map((part, i) =>
        part.kind === "text" ? (
          <SpeakableText key={i} text={part.text} language={language} playback={playback} offset={i * 1000} />
        ) : (
          <span key={i} className="word-wrap">
            <button
              type="button"
              className={`word role-${part.word.role} ${playback?.playing === i * 1000 ? "playing" : ""}`}
              aria-describedby={`${baseId}-${i}`}
              onClick={playback ? () => playback.onPlay(part.text, i * 1000) : undefined}
            >
              {part.text}
            </button>
            <span role="tooltip" id={`${baseId}-${i}`} className="word-tip" lang="en">
              <strong>{part.word.role}</strong> · {part.word.meaning}
              {part.word.note && <span className="word-note">{part.word.note}</span>}
            </span>
          </span>
        ),
      )}
    </span>
  );
};
