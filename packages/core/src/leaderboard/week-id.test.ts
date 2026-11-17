import { describe, expect, it } from "vitest";
import { daysPractisedThisWeek, isoWeekId } from "./week-id";

describe("isoWeekId", () => {
  it.each([
    [new Date(2026, 10, 15), "2026-W46"], // Sunday ends the week
    [new Date(2026, 10, 16), "2026-W47"], // Monday starts the next
    [new Date(2027, 0, 1), "2026-W53"], // Jan 1 can belong to the old year
    [new Date(2024, 11, 30), "2025-W01"], // Dec 30 can belong to the new one
  ])("%s → %s", (date, id) => {
    expect(isoWeekId(date)).toBe(id);
  });
});

describe("daysPractisedThisWeek", () => {
  it("counts distinct days in the current ISO week only", () => {
    const days = ["2026-11-08", "2026-11-09", "2026-11-12", "2026-11-12", "2026-11-15", "2026-11-16"];
    expect(daysPractisedThisWeek(days, new Date(2026, 10, 15))).toBe(3);
  });

  it("is zero with no practice", () => {
    expect(daysPractisedThisWeek([], new Date(2026, 10, 15))).toBe(0);
  });
});
