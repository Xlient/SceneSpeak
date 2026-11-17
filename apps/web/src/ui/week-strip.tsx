import type { WeekDay } from "@scenespeak/core/progress/weekly";

const weekday = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString("en", { weekday: "short" });

export const WeekStrip = ({ days }: { days: readonly WeekDay[] }) => (
  <ol className="week-strip" aria-label="Last 7 days">
    {days.map((d, i) => (
      <li key={d.day} className={d.lessons > 0 ? "practised" : ""}>
        <span className="week-dot" aria-hidden="true">
          {d.lessons > 0 ? "🔥" : ""}
        </span>
        <span className="week-label">{i === days.length - 1 ? "Today" : weekday(d.day)}</span>
        <span className="visually-hidden">{d.lessons > 0 ? `, ${d.lessons} ${d.lessons === 1 ? "lesson" : "lessons"}` : ", no practice"}</span>
      </li>
    ))}
  </ol>
);
