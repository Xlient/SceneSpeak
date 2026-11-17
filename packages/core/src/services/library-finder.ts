import type { ExistingQuery } from "../ai/lesson-generator";
import type { MatchCandidate, MatchQuery } from "../ai/lesson-match";
import type { LibraryMatch } from "../lesson/generator";
import { type LibraryEntry, type LibraryStore, rankLibrary } from "../library/library";

export type Matcher = (query: MatchQuery, candidates: readonly MatchCandidate[], signal: AbortSignal) => Promise<MatchCandidate | null>;

const CACHE_MS = 60_000;

/** Loads the library (cached briefly) and asks the matcher whether any lesson already covers the request. */
export const createLibraryFinder = ({ library, match, now = Date.now }: { library: LibraryStore; match: Matcher; now?: () => number }) => {
  let cached: { at: number; language: string; entries: LibraryEntry[] } | null = null;

  const entriesFor = async (language: string) => {
    if (cached && cached.language === language && now() - cached.at < CACHE_MS) return cached.entries;
    const entries = rankLibrary(await library.list(), language);
    cached = { at: now(), language, entries };
    return entries;
  };

  return async ({ request, topic, intents, language, signal }: ExistingQuery): Promise<LibraryMatch | null> => {
    const entries = await entriesFor(language);
    if (entries.length === 0) return null;
    const found = await match({ request, topic, intents }, entries, signal);
    const entry = found && entries.find((e) => e.id === found.id);
    return entry ? { id: entry.id, title: entry.title, votes: entry.votes } : null;
  };
};
