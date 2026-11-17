const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** "2026-11-16" → "Mon". Midday avoids time-zone edges. Plain table instead of Intl, which varies on Hermes. */
export const weekdayLabel = (day: string): string => SHORT_DAYS[new Date(`${day}T12:00:00`).getDay()] ?? day;
