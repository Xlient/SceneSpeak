import { describe, expect, it } from "vitest";
import { boardName, rankBoard } from "./board";

describe("boardName", () => {
  it("uses the first name only, with a fallback", () => {
    expect(boardName("Ana María López")).toBe("Ana");
    expect(boardName("  ")).toBe("Learner");
    expect(boardName(undefined)).toBe("Learner");
  });
});

describe("rankBoard", () => {
  const rows = [
    { uid: "a", displayName: "Zoe", daysPractised: 3 },
    { uid: "b", displayName: "Ana", daysPractised: 5 },
    { uid: "c", displayName: "Bo", daysPractised: 3 },
    { uid: "d", displayName: "Eve", daysPractised: 1 },
  ];

  it("sorts by days, shares ranks on ties and marks me", () => {
    expect(rankBoard(rows, "c").map((e) => [e.rank, e.displayName, e.isMe])).toEqual([
      [1, "Ana", false],
      [2, "Bo", true],
      [2, "Zoe", false],
      [4, "Eve", false],
    ]);
  });

  it("drops rows that don't match the format", () => {
    const bad = [{ uid: "x", displayName: "", daysPractised: 2 }, { uid: "y", displayName: "Cheat", daysPractised: 99 }, "nope", null];
    expect(rankBoard([...bad, rows[1]])).toHaveLength(1);
  });
});
