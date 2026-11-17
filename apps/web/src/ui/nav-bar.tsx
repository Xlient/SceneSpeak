import type { ReactNode } from "react";

export type Page = "lessons" | "community" | "leaderboard";

const PAGES: readonly { id: Page; label: string }[] = [
  { id: "lessons", label: "Lessons" },
  { id: "community", label: "Community" },
  { id: "leaderboard", label: "Leaderboard" },
];

export interface NavBarProps {
  current: Page | null;
  onNavigate: (page: Page) => void;
  streak: number;
  /** The account menu, rendered at the right end. */
  account: ReactNode;
}

export const NavBar = ({ current, onNavigate, streak, account }: NavBarProps) => (
  <header className="navbar">
    <h1 className="logo">
      <button type="button" className="logo-button" onClick={() => onNavigate("lessons")}>
        Scene<span>Speak</span>
      </button>
    </h1>
    <nav aria-label="Main">
      <ul className="nav-links">
        {PAGES.map((page) => (
          <li key={page.id}>
            <button
              type="button"
              className={`nav-link ${current === page.id ? "active" : ""}`}
              aria-current={current === page.id ? "page" : undefined}
              onClick={() => onNavigate(page.id)}
            >
              {page.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
    <div className="nav-right">
      <span className={`streak-badge ${streak > 0 ? "lit" : ""}`} title={streak > 0 ? `${streak}-day streak` : "Finish a lesson to start a streak"}>
        <span aria-hidden="true">{streak > 0 ? "🔥" : "🌱"}</span>
        <span className="visually-hidden">Streak: </span>
        {streak}
      </span>
      {account}
    </div>
  </header>
);
