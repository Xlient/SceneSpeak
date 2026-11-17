import { describe, expect, it } from "vitest";
import { weekdayLabel } from "./weekday";

describe("weekdayLabel", () => {
  it("names the day of a date key", () => {
    expect(weekdayLabel("2026-11-16")).toBe("Mon");
    expect(weekdayLabel("2026-11-22")).toBe("Sun");
  });
});
