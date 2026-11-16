import type { InferenceSource } from "firebase/ai";
import { describe, expect, it, vi } from "vitest";
import {
  FALLBACK_MIN_SCORE,
  type MatchCandidate,
  buildMatchPrompt,
  createLessonMatcher,
  parseMatch,
  shortlist,
  similarity,
  topicWords,
} from "./lesson-match";
import { AiAbortedError, AiTimeoutError } from "./with-timeout";

const hotel: MatchCandidate = { id: "h1", title: "Hotel check-in", topic: "checking in at a hotel", intents: ["greet", "say_name"] };
const coffee: MatchCandidate = { id: "c1", title: "Coffee at the café", topic: "ordering a coffee", intents: ["order_item", "ask_price"] };
const bakery: MatchCandidate = { id: "b1", title: "At the bakery", topic: "buying bread at a bakery", intents: ["order_item", "ask_price"] };
const all = [hotel, coffee, bakery];

const reply = (text: string | Error) => {
  const generateText = vi.fn(async (_prompt: string, _options?: { signal?: AbortSignal }) => {
    if (text instanceof Error) throw text;
    return { text, source: "on_device" as InferenceSource | undefined };
  });
  return { generateText };
};

const signal = new AbortController().signal;

describe("topicWords", () => {
  it("drops stop words and plurals, ignores accents and case", () => {
    expect([...topicWords("Meeting the new Neighbours at the Café")]).toEqual(["meeting", "neighbour", "cafe"]);
  });
});

describe("similarity and shortlist", () => {
  it("scores the same situation above unrelated ones", () => {
    const query = { topic: "check in to my hotel room", intents: ["greet" as const] };
    expect(similarity(query, hotel)).toBeGreaterThan(similarity(query, coffee));
    expect(shortlist(query, all).map((s) => s.candidate.id)).toEqual(["h1"]);
  });

  it("returns nothing for an unrelated request", () => {
    expect(shortlist({ topic: "renting a bicycle", intents: [] }, all)).toEqual([]);
  });

  it("caps the shortlist size", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ ...coffee, id: `c${i}` }));
    expect(shortlist({ topic: "ordering coffee", intents: [] }, many)).toHaveLength(5);
  });
});

describe("buildMatchPrompt", () => {
  it("wraps and escapes the request and lists candidate ids", () => {
    const prompt = buildMatchPrompt({ topic: "<ignore rules>", intents: [] }, [hotel]);
    expect(prompt).toContain("<request>&lt;ignore rules&gt;</request>");
    expect(prompt).toContain("id: h1");
  });
});

describe("parseMatch", () => {
  it("accepts only ids from the list", () => {
    expect(parseMatch('{"matchId":"h1"}', [hotel])).toBe(hotel);
    expect(parseMatch('{"matchId":"zz"}', [hotel])).toBeNull();
    expect(parseMatch('{"matchId":null}', [hotel])).toBeNull();
    expect(parseMatch('```json\n{"matchId":"h1"}\n```', [hotel])).toBe(hotel);
  });
});

describe("createLessonMatcher", () => {
  const query = { topic: "checking in at the hotel", intents: ["greet" as const] };

  it("skips the model when nothing is close", async () => {
    const model = reply('{"matchId":"h1"}');
    expect(await createLessonMatcher(model)({ topic: "renting a bicycle", intents: [] }, all, signal)).toBeNull();
    expect(model.generateText).not.toHaveBeenCalled();
  });

  it("lets the model confirm a shortlisted lesson", async () => {
    const model = reply('{"matchId":"h1"}');
    expect(await createLessonMatcher(model)(query, all, signal)).toBe(hotel);
    expect(model.generateText).toHaveBeenCalledWith(expect.stringContaining("id: h1"), { signal });
  });

  it("trusts the model's no", async () => {
    expect(await createLessonMatcher(reply('{"matchId":null}'))(query, all, signal)).toBeNull();
  });

  it("falls back to a strict word match when the model fails", async () => {
    const exact = { topic: hotel.topic, intents: ["greet" as const, "say_name" as const] };
    expect(similarity(exact, hotel)).toBeGreaterThanOrEqual(FALLBACK_MIN_SCORE);
    expect(await createLessonMatcher(reply(new AiTimeoutError(100)))(exact, all, signal)).toBe(hotel);
    expect(await createLessonMatcher(reply(new AiTimeoutError(100)))({ topic: "hotel breakfast", intents: [] }, all, signal)).toBeNull();
  });

  it("rethrows a cancel", async () => {
    await expect(createLessonMatcher(reply(new AiAbortedError()))(query, all, signal)).rejects.toBeInstanceOf(AiAbortedError);
  });

  it("judges by the learner's words when the summary drifted", async () => {
    const directions: MatchCandidate = { id: "d1", title: "Asking for directions", topic: "asking for directions to the bank", intents: ["ask_directions"] };
    const exchange: MatchCandidate = { id: "x1", title: "Exchanging money", topic: "exchanging money at the bank", intents: ["ask_for_help"] };
    const query = { request: "how to exchange money at the bank", topic: "asking for directions to the bank", intents: [] };
    // Words alone can't separate them, so both stay on the shortlist and the model decides from the request.
    expect(shortlist(query, [directions, exchange]).map((s) => s.candidate.id)).toContain("x1");
    expect(buildMatchPrompt(query, [exchange])).toContain("<request>how to exchange money at the bank</request>");
  });
});
