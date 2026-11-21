import { useId, useState } from "react";
import type { AuthStatus } from "@scenespeak/core/auth/auth-state";
import type { LibraryEntry } from "@scenespeak/core/library/library";
import { type LanguageFilter, matchesLanguage } from "@scenespeak/core/language/language-filter";
import { languageName } from "@scenespeak/core/language/languages";
import { LessonLanguageMeta } from "./language-badges";
import { useLibrary } from "./use-library";

export interface LibrarySectionProps {
  auth: AuthStatus;
  /** Shown languages; null shows every language. Filtered here, so changing it doesn't reload the library. */
  filter: LanguageFilter;
  onPlay: (entry: LibraryEntry) => void;
  onCreate: () => void;
  onSignIn?: (() => void) | undefined;
}

const matches = (entry: LibraryEntry, query: string) => {
  const q = query.trim().toLowerCase();
  return q === "" || `${entry.title} ${entry.topic}`.toLowerCase().includes(q);
};

export const LibrarySection = ({ auth, filter, onPlay, onCreate, onSignIn }: LibrarySectionProps) => {
  const { state, voted, canVote, toggleVote, report, notice } = useLibrary(auth, null);
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const searchId = useId();
  const entries = state.status === "ready" ? state.entries.filter((e) => matchesLanguage(e.language, filter) && matches(e, query)) : [];

  return (
    <section aria-labelledby="library-title" aria-busy={state.status === "loading"}>
      <div className="library-head">
        <h3 id="library-title" className="section-title">
          Lesson library
        </h3>
        <div className="library-search">
          <label htmlFor={searchId} className="visually-hidden">
            Search the library
          </label>
          <input id={searchId} type="search" placeholder="Search lessons" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <p className="audio-note">
        Lessons people made with "Create a lesson" and chose to share. Upvote the ones you like.
        {!canVote && onSignIn && (
          <>
            {" "}
            <button type="button" className="link-button" onClick={onSignIn}>
              Sign in with Google
            </button>{" "}
            to vote or share your own.
          </>
        )}
      </p>
      <p className="audio-note" role="status" aria-live="polite">
        {notice}
      </p>

      {state.status === "loading" && <p>Loading lessons…</p>}
      {state.status === "failed" && <p className="error">{state.message}</p>}
      {state.status === "ready" && entries.length === 0 && (
        <p>
          {query ? "No lessons match that search. " : filter ? `No shared ${languageName(filter)} lessons yet. ` : "No shared lessons yet. "}
          <button type="button" className="link-button" onClick={onCreate}>
            Create one
          </button>
          {query ? " instead?" : " and be the first to share it!"}
        </p>
      )}

      {entries.length > 0 && (
        <ul className="lesson-grid">
          {entries.map((entry) => {
            const mine = voted.has(entry.id);
            return (
              <li key={entry.id} className="card lesson-card library-card">
                <h3>{entry.title}</h3>
                <p>{entry.topic}</p>
                <LessonLanguageMeta language={entry.language} level={entry.level} />
                <p className="lesson-credit">By {entry.authorName}</p>
                <div className="lesson-play-buttons">
                  <button type="button" onClick={() => onPlay(entry)} aria-label={`Play ${entry.title}`}>
                    Play
                  </button>
                  <button
                    type="button"
                    className={`secondary vote-button ${mine ? "voted" : ""}`}
                    aria-pressed={mine}
                    disabled={!canVote}
                    title={canVote ? undefined : "Sign in with Google to vote"}
                    onClick={() => void toggleVote(entry.id)}
                  >
                    <span aria-hidden="true">▲</span> {entry.votes}
                    <span className="visually-hidden"> upvotes{mine ? ", you upvoted this" : ""}. Upvote {entry.title}</span>
                  </button>
                </div>
                {canVote &&
                  (confirming === entry.id ? (
                    <p className="report-confirm">
                      Report as unsuitable?{" "}
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => {
                          setConfirming(null);
                          void report(entry.id);
                        }}
                      >
                        Yes, report
                      </button>{" "}
                      <button type="button" className="link-button" onClick={() => setConfirming(null)}>
                        Cancel
                      </button>
                    </p>
                  ) : (
                    <button type="button" className="link-button report-button" onClick={() => setConfirming(entry.id)}>
                      ⚑ Report<span className="visually-hidden"> {entry.title}</span>
                    </button>
                  ))}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
