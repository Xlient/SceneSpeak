import { useMemo, useState } from "react";
import type { AuthClient } from "../auth/auth-client";
import { createDefaultAuth } from "../auth/default-auth";
import { COMMUNITY_LESSONS } from "../lesson/community/community-lessons";
import { FEATURED_LESSONS } from "../lesson/featured/featured-lessons";
import { type PlayableLesson, buildPlayableLesson } from "../lesson/playable-lesson";
import { type AppServices, createAppServices } from "../services/app-services";
import { AccountButton } from "./account-button";
import { CreateLessonScreen } from "./create-lesson-screen";
import { HomeScreen } from "./home-screen";
import { LessonScreen } from "./lesson-screen";
import { ModelMonitorPanel } from "./model-monitor-panel";
import { ServicesProvider } from "./services-context";
import { StreakPill } from "./streak-pill";
import { usePractice } from "./use-practice";

type Screen = { kind: "home" } | { kind: "create" } | { kind: "lesson"; lesson: PlayableLesson };

/** `auth: null` turns accounts off; omitted, it uses Firebase Auth when configured. */
export const App = ({ services, auth }: { services?: AppServices; auth?: AuthClient | null }) => {
  const appServices = useMemo(() => services ?? createAppServices(), [services]);
  const authClient = useMemo(() => (auth === undefined ? createDefaultAuth() : auth), [auth]);
  const practice = usePractice();
  const [screen, setScreen] = useState<Screen>({ kind: "home" });
  const [monitorOpen, setMonitorOpen] = useState(false);
  const home = () => setScreen({ kind: "home" });

  return (
    <ServicesProvider services={appServices}>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div className="app">
        <header className="topbar">
          <div>
            <h1 className="logo">
              Scene<span>Speak</span>
            </h1>
            <p className="tagline">Learn the conversation you actually need.</p>
          </div>
          <div className="actions">
            <StreakPill streak={practice.streak} lessonsDone={practice.lessonsDone} />
            <span className="pill" role="status">
              <span className="dot" aria-hidden="true" />
              On-device AI: not connected
            </span>
            {authClient && <AccountButton client={authClient} />}
            <button type="button" className="secondary" aria-expanded={monitorOpen} aria-controls="monitor" onClick={() => setMonitorOpen((open) => !open)}>
              📊 Model Monitor
            </button>
          </div>
        </header>

        <div className={`layout ${monitorOpen ? "with-monitor" : ""}`}>
          <main id="content" tabIndex={-1}>
            {screen.kind === "home" && (
              <HomeScreen
                featured={FEATURED_LESSONS}
                community={COMMUNITY_LESSONS}
                onCreate={() => setScreen({ kind: "create" })}
                onPlay={(featured) => setScreen({ kind: "lesson", lesson: buildPlayableLesson(featured.scenario, featured.recipe) })}
              />
            )}
            {screen.kind === "create" && <CreateLessonScreen onCancel={home} onReady={(lesson) => setScreen({ kind: "lesson", lesson })} />}
            {screen.kind === "lesson" && <LessonScreen key={screen.lesson.scenario.id} lesson={screen.lesson} onExit={home} onComplete={practice.finishLesson} />}
          </main>
          {monitorOpen && (
            <div id="monitor">
              <ModelMonitorPanel onClose={() => setMonitorOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </ServicesProvider>
  );
};
