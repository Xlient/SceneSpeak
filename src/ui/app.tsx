import { useMemo, useState } from "react";
import type { AuthClient } from "../auth/auth-client";
import { createDefaultAuth } from "../auth/default-auth";
import { COMMUNITY_LESSONS } from "../lesson/community/community-lessons";
import { FEATURED_LESSONS, type FeaturedLesson } from "../lesson/featured/featured-lessons";
import type { LessonMode } from "../lesson/lesson-mode";
import { type PlayableLesson, buildPlayableLesson } from "../lesson/playable-lesson";
import { type AppServices, createAppServices, createLiveServices } from "../services/app-services";
import { AccountMenu } from "./account-menu";
import { CommunityScreen } from "./community-screen";
import { CreateLessonScreen } from "./create-lesson-screen";
import { describeDeviceStatus } from "./device-status";
import { HomeScreen } from "./home-screen";
import { LeaderboardScreen } from "./leaderboard-screen";
import { LessonScreen } from "./lesson-screen";
import { ModelMonitorPanel } from "./model-monitor-panel";
import { NavBar, type Page } from "./nav-bar";
import { ServicesProvider } from "./services-context";
import { useAuth } from "./use-auth";
import { useDeviceModel } from "./use-device-model";
import { usePractice } from "./use-practice";

type Screen = { kind: "page"; page: Page } | { kind: "create" } | { kind: "lesson"; lesson: PlayableLesson; mode: LessonMode };

/** `auth: null` turns accounts off; omitted, it uses Firebase Auth when configured. */
export const App = ({ services, auth }: { services?: AppServices; auth?: AuthClient | null }) => {
  const appServices = useMemo(() => services ?? createAppServices(createLiveServices()), [services]);
  const authClient = useMemo(() => (auth === undefined ? createDefaultAuth() : auth), [auth]);
  return (
    <ServicesProvider services={appServices}>
      <Shell authClient={authClient} />
    </ServicesProvider>
  );
};

// Lives inside ServicesProvider so the device-model and auth hooks can reach services.
const Shell = ({ authClient }: { authClient: AuthClient | null }) => {
  const session = useAuth(authClient);
  const device = useDeviceModel();
  const practice = usePractice();
  const [screen, setScreen] = useState<Screen>({ kind: "page", page: "lessons" });
  const [monitorOpen, setMonitorOpen] = useState(false);
  const go = (page: Page) => setScreen({ kind: "page", page });
  const play = (featured: FeaturedLesson, mode: LessonMode) =>
    setScreen({ kind: "lesson", lesson: buildPlayableLesson(featured.scenario, featured.recipe), mode });

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div className="app">
        <NavBar
          current={screen.kind === "page" ? screen.page : "lessons"}
          onNavigate={go}
          streak={practice.streak}
          account={
            <AccountMenu
              auth={session}
              device={describeDeviceStatus(device.status)}
              onDeviceSetUp={device.setUp}
              streak={practice.streak}
              lessonsDone={practice.lessonsDone}
              monitorOpen={monitorOpen}
              onToggleMonitor={() => setMonitorOpen((open) => !open)}
            />
          }
        />

        <div className={`layout ${monitorOpen ? "with-monitor" : ""}`}>
          <main id="content" tabIndex={-1}>
            {screen.kind === "page" && screen.page === "lessons" && (
              <HomeScreen
                featured={FEATURED_LESSONS}
                community={COMMUNITY_LESSONS}
                onCreate={() => setScreen({ kind: "create" })}
                onPlay={play}
                onBrowseCommunity={() => go("community")}
              />
            )}
            {screen.kind === "page" && screen.page === "community" && <CommunityScreen lessons={COMMUNITY_LESSONS} onPlay={play} />}
            {screen.kind === "page" && screen.page === "leaderboard" && (
              <LeaderboardScreen
                auth={session.status}
                streak={practice.streak}
                best={practice.best}
                lessonsDone={practice.lessonsDone}
                onSignIn={session.enabled ? session.signInWithGoogle : undefined}
              />
            )}
            {screen.kind === "create" && <CreateLessonScreen onCancel={() => go("lessons")} onReady={(lesson) => setScreen({ kind: "lesson", lesson, mode: "typing" })} />}
            {screen.kind === "lesson" && (
              <LessonScreen
                key={screen.lesson.scenario.id}
                lesson={screen.lesson}
                initialMode={screen.mode}
                onExit={() => go("lessons")}
                onComplete={practice.finishLesson}
              />
            )}
          </main>
          {monitorOpen && (
            <div id="monitor">
              <ModelMonitorPanel onClose={() => setMonitorOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
