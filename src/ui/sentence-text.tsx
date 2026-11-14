import { useId } from "react";
import { type SentenceBreakdown, linkWords } from "../lesson/sentence-breakdown";

/** The line itself; once broken down, each word can be hovered or focused to show its grammar role. */
export const SentenceText = ({ text, language, breakdown }: { text: string; language: string; breakdown?: SentenceBreakdown }) => {
  const baseId = useId();
  if (!breakdown) return <span lang={language}>{text}</span>;
  return (
    <span lang={language}>
      {linkWords(text, breakdown.words).map((part, i) =>
        part.kind === "text" ? (
          <span key={i}>{part.text}</span>
        ) : (
          <span key={i} className="word-wrap">
            <button type="button" className={`word role-${part.word.role}`} aria-describedby={`${baseId}-${i}`}>
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
