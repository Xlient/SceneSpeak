export const StreakPill = ({ streak, lessonsDone }: { streak: number; lessonsDone: number }) => (
  <span className={`pill streak-pill ${streak > 0 ? "lit" : ""}`} title={`${lessonsDone} lessons finished`}>
    <span aria-hidden="true">{streak > 0 ? "🔥" : "🌱"}</span>
    {streak > 0 ? `${streak}-day streak` : "Start a streak"}
  </span>
);
