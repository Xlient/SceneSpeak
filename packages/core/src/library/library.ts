import { z } from "zod";
import { MAX_BOARD_NAME, boardName } from "../leaderboard/board";
import type { GeneratedLesson } from "../lesson/generator";
import { SceneRecipe } from "../scene/recipe/scene-recipe";
import { type Intent, Level, Scenario, isIntent } from "../schemas";
import { text } from "../schemas/primitives";
import { NotConnectedError } from "../services/not-connected";

export const LIBRARY_LOAD_LIMIT = 200;
export const HIDE_AFTER_REPORTS = 3;
export const MAX_TITLE = 80;
export const MAX_TOPIC = 200;
/** Stored as a JSON string so the rules only need to check its size. */
export const MAX_LESSON_CHARS = 60_000;

/** One row of the public library. The lesson itself lives in a separate document. */
export const LibraryEntry = z.object({
  id: z.string().min(1).max(128),
  title: text(MAX_TITLE),
  topic: text(MAX_TOPIC),
  language: z.string().regex(/^[a-z]{2}$/),
  level: Level.catch("A1"),
  intents: z
    .array(z.unknown())
    .catch([])
    .transform((items) => items.filter(isIntent).slice(0, 6)),
  authorUid: z.string().min(1).max(128),
  authorName: text(MAX_BOARD_NAME),
  votes: z.number().int().min(0).catch(0),
  hidden: z.boolean().catch(true),
});
export type LibraryEntry = z.infer<typeof LibraryEntry>;

/** Server rows → visible entries for one language (null: every language), most upvoted first. Bad or hidden rows are dropped. */
export const rankLibrary = (rows: readonly unknown[], language: string | null): LibraryEntry[] =>
  rows
    .flatMap((row) => {
      const parsed = LibraryEntry.safeParse(row);
      return parsed.success && !parsed.data.hidden && (language === null || parsed.data.language === language) ? [parsed.data] : [];
    })
    .toSorted((a, b) => b.votes - a.votes || a.title.localeCompare(b.title));

const StoredLesson = z.object({ scenario: Scenario, recipe: z.unknown() });

/** The stored lesson is user-published model output: validate it like any other. */
export const parseLibraryLesson = (raw: unknown): GeneratedLesson => {
  const json = typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
  const parsed = StoredLesson.parse(json);
  const recipe = SceneRecipe.safeParse(parsed.recipe);
  if (!recipe.success) throw new Error("This library lesson's scene is broken.");
  return { scenario: parsed.scenario, recipe: recipe.data };
};

export interface PublishInput {
  lesson: GeneratedLesson;
  topic: string;
  intents: readonly Intent[];
  authorUid: string;
  authorDisplayName: string | undefined;
}

export interface PublishDoc {
  title: string;
  topic: string;
  language: string;
  level: string;
  intents: string[];
  authorUid: string;
  authorName: string;
  lesson: string;
}

export const toPublishDoc = ({ lesson, topic, intents, authorUid, authorDisplayName }: PublishInput): PublishDoc => {
  const json = JSON.stringify({ scenario: lesson.scenario, recipe: lesson.recipe });
  if (json.length > MAX_LESSON_CHARS) throw new Error("This lesson is too long to publish.");
  return {
    title: lesson.scenario.title.slice(0, MAX_TITLE),
    topic: topic.trim().slice(0, MAX_TOPIC) || lesson.scenario.title.slice(0, MAX_TOPIC),
    language: lesson.scenario.language,
    level: lesson.scenario.level,
    intents: [...intents].slice(0, 6),
    authorUid,
    authorName: boardName(authorDisplayName),
    lesson: json,
  };
};

export interface LibraryStore {
  /** Visible rows, unvalidated (run them through `rankLibrary`). */
  list: () => Promise<unknown[]>;
  /** The lesson JSON for one entry, unvalidated (run it through `parseLibraryLesson`). */
  lesson: (id: string) => Promise<unknown>;
  publish: (doc: PublishDoc) => Promise<string>;
  /** Which of these entries this user has upvoted. */
  myVotes: (ids: readonly string[], uid: string) => Promise<Set<string>>;
  setVote: (id: string, uid: string, on: boolean) => Promise<void>;
  report: (id: string, uid: string) => Promise<void>;
}

const off = () => Promise.reject(new NotConnectedError("The lesson library isn't connected in this copy of SceneSpeak."));
export const unavailableLibrary: LibraryStore = { list: off, lesson: off, publish: off, myVotes: off, setVote: off, report: off };
