import type { AuthStatus } from "../auth/auth-state";
import { Avatar } from "./avatar";

export interface LeaderboardScreenProps {
  auth: AuthStatus;
  streak: number;
  best: number;
  lessonsDone: number;
  onSignIn?: (() => void) | undefined;
}

export const LeaderboardScreen = ({ auth, streak, best, lessonsDone, onSignIn }: LeaderboardScreenProps) => {
  const name = auth.kind === "member" ? (auth.user.displayName ?? "You") : "You";
  return (
    <section className="page" aria-labelledby="leaderboard-title">
      <div className="page-header">
        <h2 id="leaderboard-title">Leaderboard</h2>
        <p>Practise a little every day to keep your streak alive.</p>
      </div>

      <section className="card page-card your-stats" aria-labelledby="stats-title">
        <div className="stats-profile">
          <Avatar status={auth} size="large" />
          <h3 id="stats-title">{name}</h3>
        </div>
        <dl className="stats">
          <div>
            <dt>Current streak</dt>
            <dd>{streak > 0 ? `🔥 ${streak}` : "0"}</dd>
          </div>
          <div>
            <dt>Best streak</dt>
            <dd>{best}</dd>
          </div>
          <div>
            <dt>Lessons finished</dt>
            <dd>{lessonsDone}</dd>
          </div>
        </dl>
        <p className="audio-note">Stored on this device only.</p>
      </section>

      <section className="card page-card" aria-labelledby="weekly-title">
        <h3 id="weekly-title">This week</h3>
        <p>Weekly leaderboards with friends are coming soon. They'll rank by days practised, not by speed, so everyone can keep up.</p>
        {auth.kind !== "member" && onSignIn && (
          <button type="button" onClick={onSignIn}>
            Sign in with Google to join
          </button>
        )}
      </section>
    </section>
  );
};
