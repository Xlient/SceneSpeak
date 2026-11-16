import { useCallback, useEffect, useState } from "react";
import type { AuthStatus } from "../auth/auth-state";
import { type LibraryEntry, rankLibrary } from "../library/library";
import { NotConnectedError } from "../services/not-connected";
import { useServices } from "./services-context";

/** Votes are only looked up for the top of the list, to keep reads cheap. */
const VOTE_LOOKUP_LIMIT = 30;

type LoadState = { status: "loading" } | { status: "ready"; entries: LibraryEntry[] } | { status: "failed"; message: string };

const messageOf = (error: unknown, fallback: string) => (error instanceof NotConnectedError ? error.message : fallback);

export const useLibrary = (auth: AuthStatus, language: string) => {
  const { library } = useServices();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [voted, setVoted] = useState<ReadonlySet<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const uid = auth.kind === "member" ? auth.user.uid : null;
  // The rules only let signed-in users (guests included) read, so wait for auth to settle.
  const authReady = auth.kind !== "loading";

  useEffect(() => {
    if (!authReady) return;
    let live = true;
    setState({ status: "loading" });
    library
      .list()
      .then(async (rows) => {
        const entries = rankLibrary(rows, language);
        if (!live) return;
        setState({ status: "ready", entries });
        if (uid) {
          const mine = await library.myVotes(entries.slice(0, VOTE_LOOKUP_LIMIT).map((e) => e.id), uid);
          if (live) setVoted(mine);
        } else {
          setVoted(new Set());
        }
      })
      .catch((error: unknown) => {
        if (live) setState({ status: "failed", message: messageOf(error, "Couldn't load the library. Check your connection and try again.") });
      });
    return () => {
      live = false;
    };
  }, [library, language, uid, authReady]);

  const bump = (id: string, delta: number) =>
    setState((current) =>
      current.status === "ready"
        ? { ...current, entries: current.entries.map((e) => (e.id === id ? { ...e, votes: Math.max(0, e.votes + delta) } : e)) }
        : current,
    );

  const toggleVote = useCallback(
    async (id: string) => {
      if (!uid) return;
      const on = !voted.has(id);
      const next = new Set(voted);
      if (on) next.add(id);
      else next.delete(id);
      setVoted(next);
      bump(id, on ? 1 : -1);
      try {
        await library.setVote(id, uid, on);
      } catch (error) {
        setVoted(voted);
        bump(id, on ? -1 : 1);
        setNotice(messageOf(error, "Couldn't save your vote. Try again."));
      }
    },
    [library, uid, voted],
  );

  const report = useCallback(
    async (id: string) => {
      if (!uid) return;
      try {
        await library.report(id, uid);
        setState((current) => (current.status === "ready" ? { ...current, entries: current.entries.filter((e) => e.id !== id) } : current));
        setNotice("Thanks for reporting. Lessons reported by several people are hidden until they're reviewed.");
      } catch (error) {
        setNotice(messageOf(error, "Couldn't send the report. You may have reported it already."));
      }
    },
    [library, uid],
  );

  return { state, voted, canVote: uid !== null, toggleVote, report, notice };
};
