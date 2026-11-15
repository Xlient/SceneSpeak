import type { AuthStatus } from "../auth/auth-state";
import type { CoachLessonOption } from "../progress/coach";
import type { WeekDay, WeeklySummary } from "../progress/weekly";
import { Avatar } from "./avatar";
import { CoachCard } from "./coach-card";
import { WeekStrip } from "./week-strip";

export interface LeaderboardScreenProps {
  auth: AuthStatus;
  streak: number;
  best: number;
  lessonsDone: number;
  xp: number;
  week: readonly WeekDay[];
  summary: WeeklySummary;
  language: string;
  lessons: readonly CoachLessonOption[];
  onPlayLesson: (lessonId: string) => void;
  onSignIn?: (() => void) | undefined;
}

export const LeaderboardScreen = ({ auth, streak, best, lessonsDone, xp, week, summary, language, lessons, onPlayLesson, onSignIn }: LeaderboardScreenProps) => {
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
        <WeekStrip days={week} />
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
            <dt>Points</dt>
            <dd>⭐ {xp}</dd>
          </div>
          <div>
            <dt>Lessons finished</dt>
            <dd>{lessonsDone}</dd>
          </div>
        </dl>
        <p className="audio-note">Stored on this device only.</p>
      </section>

      <div className="page-columns">
        <CoachCard summary={summary} language={language} lessons={lessons} onPlay={onPlayLesson} />

        <section className="card page-card" aria-labelledby="weekly-title">
          <h3 id="weekly-title">Friends this week</h3>
          <p>Weekly leaderboards with friends are coming soon. They'll rank by days practised, not speed, so everyone can keep up. Only your name and days practised will be shared.</p>
          {auth.kind !== "member" && onSignIn && (
            <button type="button" onClick={onSignIn}>
              Sign in with Google to join
            </button>
          )}
        </section>
      </div>
    </section>
  );
};
