import { z } from "zod";
import { NotConnectedError } from "../services/not-connected";

export const MAX_BOARD_NAME = 40;
export const BOARD_SIZE = 20;

/** The only data that ever leaves the device for the leaderboard. */
export const BoardEntry = z.object({
  uid: z.string().min(1).max(128),
  displayName: z.string().trim().min(1).max(MAX_BOARD_NAME),
  daysPractised: z.number().int().min(0).max(7),
});
export type BoardEntry = z.infer<typeof BoardEntry>;

export interface RankedEntry extends BoardEntry {
  rank: number;
  isMe: boolean;
}

/** First name only, so the public board shows less than the Google profile does. */
export const boardName = (displayName: string | undefined): string => {
  const first = displayName?.trim().split(/\s+/)[0] ?? "";
  return (first || "Learner").slice(0, MAX_BOARD_NAME);
};

/** Most days first; ties share a rank and are listed by name. Unknown rows from the server are dropped. */
export const rankBoard = (rows: readonly unknown[], myUid?: string): RankedEntry[] => {
  const entries = rows
    .flatMap((row) => {
      const parsed = BoardEntry.safeParse(row);
      return parsed.success ? [parsed.data] : [];
    })
    .toSorted((a, b) => b.daysPractised - a.daysPractised || a.displayName.localeCompare(b.displayName));
  let rank = 0;
  let previous = -1;
  return entries.map((entry, index) => {
    if (entry.daysPractised !== previous) rank = index + 1;
    previous = entry.daysPractised;
    return { ...entry, rank, isMe: entry.uid === myUid };
  });
};

export interface BoardStore {
  /** Top rows for a week, unvalidated (run them through `rankBoard`). */
  load: (weekId: string) => Promise<unknown[]>;
  publish: (weekId: string, entry: BoardEntry) => Promise<void>;
  remove: (weekId: string, uid: string) => Promise<void>;
}

const off = () => Promise.reject(new NotConnectedError("The leaderboard isn't connected in this copy of SceneSpeak."));
export const unavailableBoard: BoardStore = { load: off, publish: off, remove: off };
