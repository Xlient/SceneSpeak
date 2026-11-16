import { describe, expect, it, vi } from "vitest";
import { type LibraryStore, unavailableLibrary } from "../library/library";
import { createLibraryFinder } from "./library-finder";

const row = (id: string, votes: number, language = "es") => ({
  id,
  title: `Lesson ${id}`,
  topic: "checking in at a hotel",
  language,
  level: "A1",
  intents: ["greet"],
  authorUid: "u",
  authorName: "Sam",
  votes,
  hidden: false,
});

const storeWith = (rows: unknown[]): LibraryStore => ({ ...unavailableLibrary, list: vi.fn(async () => rows) });
const query = { request: "check in at my hotel", topic: "hotel check in", intents: [], language: "es", signal: new AbortController().signal };

describe("createLibraryFinder", () => {
  it("returns the matched entry's id, title and votes", async () => {
    const match = vi.fn(async (_q: unknown, _c: readonly unknown[], _s: AbortSignal) => ({ id: "a", title: "", topic: "", intents: [] }));
    const find = createLibraryFinder({ library: storeWith([row("a", 4), row("b", 1, "fr")]), match });
    expect(await find(query)).toEqual({ id: "a", title: "Lesson a", votes: 4 });
    expect(match.mock.calls[0]?.[1]).toHaveLength(1);
  });

  it("skips the matcher when the library is empty for that language", async () => {
    const match = vi.fn(async () => null);
    expect(await createLibraryFinder({ library: storeWith([row("b", 1, "fr")]), match })(query)).toBeNull();
    expect(match).not.toHaveBeenCalled();
  });

  it("caches the list briefly", async () => {
    let time = 0;
    const library = storeWith([row("a", 1)]);
    const find = createLibraryFinder({ library, match: async () => null, now: () => time });
    await find(query);
    await find(query);
    time = 61_000;
    await find(query);
    expect(library.list).toHaveBeenCalledTimes(2);
  });
});
