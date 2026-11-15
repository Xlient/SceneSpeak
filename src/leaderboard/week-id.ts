/** ISO week of a local calendar day, e.g. "2026-W46". Weeks start on Monday. */
export const isoWeekId = (date: Date): string => {
  const day = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // The ISO year is the year of this week's Thursday.
  day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((day.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

/** Days practised since Monday of the current ISO week, from a list of practised day keys (YYYY-MM-DD). */
export const daysPractisedThisWeek = (practisedDays: readonly string[], today: Date): number => {
  const week = isoWeekId(today);
  const inWeek = practisedDays.filter((key) => {
    const [y = 0, m = 1, d = 1] = key.split("-").map(Number);
    return isoWeekId(new Date(y, m - 1, d)) === week;
  });
  return Math.min(7, new Set(inWeek).size);
};
