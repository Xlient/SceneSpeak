import { useCallback, useEffect, useState } from "react";
import type { AuthStatus } from "../auth/auth-state";
import { type BoardStore, type RankedEntry, boardName, rankBoard } from "../leaderboard/board";
import { daysPractisedThisWeek, isoWeekId } from "../leaderboard/week-id";
import { NotConnectedError } from "../services/not-connected";

const JOINED_KEY = "scenespeak-board-joined-v1";
const readJoined = () => {
  try {
    return localStorage.getItem(JOINED_KEY) === "yes";
  } catch {
    return false;
  }
};
const writeJoined = (joined: boolean) => {
  try {
    localStorage.setItem(JOINED_KEY, joined ? "yes" : "no");
  } catch {
    // Remembered for this visit only.
  }
};

type BoardState = { status: "loading" } | { status: "ready"; rows: RankedEntry[] } | { status: "failed"; message: string };

export interface BoardCardProps {
  store: BoardStore;
  auth: AuthStatus;
  practisedDays: readonly string[];
  onSignIn?: (() => void) | undefined;
}

/** This week's board. Players choose to appear; only a first name and days practised are shared. */
export const BoardCard = ({ store, auth, practisedDays, onSignIn }: BoardCardProps) => {
  const member = auth.kind === "member" ? auth.user : undefined;
  const signedIn = auth.kind === "member" || auth.kind === "guest";
  const [joined, setJoined] = useState(readJoined);
  const [state, setState] = useState<BoardState>({ status: "loading" });
  const [busy, setBusy] = useState(false);
  const weekId = isoWeekId(new Date());
  const days = daysPractisedThisWeek(practisedDays, new Date());
  const uid = member?.uid;
  const name = boardName(member?.displayName);

  const refresh = useCallback(
    async (isCurrent: () => boolean = () => true) => {
      try {
        if (uid && joined) await store.publish(weekId, { uid, displayName: name, daysPractised: days });
        const rows = rankBoard(await store.load(weekId), uid);
        if (isCurrent()) setState({ status: "ready", rows });
      } catch (error) {
        if (!isCurrent()) return;
        setState({ status: "failed", message: error instanceof NotConnectedError ? error.message : "Couldn't load the leaderboard. Check your connection." });
      }
    },
    [store, weekId, uid, joined, name, days],
  );

  useEffect(() => {
    if (!signedIn) return;
    let current = true;
    void refresh(() => current);
    return () => {
      current = false;
    };
  }, [signedIn, refresh]);

  const toggleJoined = async () => {
    if (!uid) return;
    const next = !joined;
    setBusy(true);
    try {
      if (!next) await store.remove(weekId, uid);
      writeJoined(next);
      setJoined(next);
    } catch {
      setState({ status: "failed", message: "Couldn't update the leaderboard. Try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card page-card board-card" aria-labelledby="weekly-title" aria-busy={state.status === "loading" && signedIn}>
      <h3 id="weekly-title">This week's board</h3>
      <p className="audio-note">Ranked by days practised, not speed. Only a first name and days practised are shared.</p>

      {!signedIn && <p>Sign in to see the board.</p>}
      {signedIn && state.status === "loading" && <p role="status">Loading the board…</p>}
      {signedIn && state.status === "failed" && <p role="status">{state.message}</p>}
      {signedIn && state.status === "ready" &&
        (state.rows.length === 0 ? (
          <p>Nobody's on the board yet this week. Be the first!</p>
        ) : (
          <ol className="board-list">
            {state.rows.map((row) => (
              <li key={row.uid} className={row.isMe ? "me" : ""}>
                <span className="board-rank">{row.rank}</span>
                <span className="board-name">
                  {row.displayName}
                  {row.isMe && " (you)"}
                </span>
                <span className="board-days">
                  {row.daysPractised} {row.daysPractised === 1 ? "day" : "days"}
                </span>
              </li>
            ))}
          </ol>
        ))}

      {member ? (
        <label className="toggle">
          <input type="checkbox" checked={joined} disabled={busy} onChange={() => void toggleJoined()} />
          <span>Show me on the board as “{name}”</span>
        </label>
      ) : (
        onSignIn && (
          <button type="button" onClick={onSignIn}>
            Sign in with Google to join
          </button>
        )
      )}
    </section>
  );
};
