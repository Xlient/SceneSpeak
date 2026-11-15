import type { LessonScore } from "../lesson/scoring";

const TITLES = ["Keep practising!", "Good start!", "¡Muy bien!", "¡Perfecto!"] as const;

export interface LessonSummaryProps {
  score: LessonScore;
  language: string;
  onExit: () => void;
}

/** End-of-lesson card: stars, points and the phrases worth another go. */
export const LessonSummary = ({ score, language, onExit }: LessonSummaryProps) => (
  <div className="done-card" role="status">
    <h3>{TITLES[score.stars] ?? TITLES[0]}</h3>
    <p className="stars" role="img" aria-label={`${score.stars} of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= score.stars ? "star on" : "star"} aria-hidden="true">
          ★
        </span>
      ))}
    </p>
    <p className="xp-earned">+{score.xp} points</p>
    <p>
      {score.goalsDone} of {score.goalsTotal} goals done
      {score.firstTryGoals > 0 && ` · ${score.firstTryGoals} on the first try`}
      {score.accuracy !== null && ` · ${score.accuracy}% first-try score`}
    </p>

    {score.review.length > 0 && (
      <div className="review">
        <h4>Phrases to review</h4>
        <ul>
          {score.review.map((phrase) => (
            <li key={phrase.lineId}>
              <span lang={language}>{phrase.text}</span>
              <span className="line-translation">{phrase.translation}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    <button type="button" onClick={onExit}>
      Back to lessons
    </button>
  </div>
);
