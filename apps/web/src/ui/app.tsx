import { useMemo, useState } from "react";
import type { AuthClient } from "@scenespeak/core/auth/auth-client";
import { createDefaultAuth } from "@scenespeak/core/auth/default-auth";
import { COMMUNITY_LESSONS } from "@scenespeak/core/lesson/community/community-lessons";
import { FEATURED_LESSONS, type FeaturedLesson } from "@scenespeak/core/lesson/featured/featured-lessons";
import type { LessonMode } from "@scenespeak/core/lesson/lesson-mode";
import { createDefaultBoard } from "@scenespeak/core/leaderboard/default-board";
import type { LessonOrigin } from "@scenespeak/core/lesson/lesson-origin";
import { type PlayableLesson, buildPlayableLesson } from "@scenespeak/core/lesson/playable-lesson";
import { type LibraryEntry, parseLibraryLesson } from "@scenespeak/core/library/library";
import { NotConnectedError } from "@scenespeak/core/services/not-connected";
import { type AppServices, createAppServices, createLiveServices } from "@scenespeak/core/services/app-services";
import { AccountMenu } from "./account-menu";
import { CommunityScreen } from "./community-screen";
import { CreateLessonScreen } from "./create-lesson-screen";
import { describeDeviceStatus } from "./device-status";
import { HomeScreen } from "./home-screen";
import { LeaderboardScreen } from "./leaderboard-screen";
import { LessonScreen } from "./lesson-screen";
import { LibrarySection } from "./library-section";
import { ModelMonitorPanel } from "./model-monitor-panel";
import { PublishBar } from "./publish-bar";
import { useServices } from "./services-context";
import { PrivacyPage } from "./privacy-page";
import { TermsPage } from "./terms-page";
import { WelcomeTour } from "./welcome-tour";
import { tourStore } from "@scenespeak/core/onboarding/tour-store";
import { NavBar, type Page } from "./nav-bar";
import { ServicesProvider } from "./services-context";
import { useAuth } from "./use-auth";
import { useDeviceModel } from "./use-device-model";
import { usePractice } from "./use-practice";

const ALL_LESSONS: readonly FeaturedLesson[] = [...FEATURED_LESSONS, ...COMMUNITY_LESSONS];
const COACH_LESSONS = ALL_LESSONS.map((l) => ({ id: l.scenario.id, title: l.scenario.title, level: l.scenario.level }));

type Screen =
  | { kind: "page"; page: Page }
  | { kind: "create" }
  | { kind: "lesson"; lesson: PlayableLesson; mode: LessonMode; origin: LessonOrigin }
  | { kind: "legal"; doc: "privacy" | "terms"; back: Screen };

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
  const board = useMemo(createDefaultBoard, []);
  const { library } = useServices();
  const [screen, setScreen] = useState<Screen>({ kind: "page", page: "lessons" });
  const [notice, setNotice] = useState<string | null>(null);
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(() => !tourStore.seen());
  const closeTour = () => {
    tourStore.markSeen();
    setTourOpen(false);
  };
  const openLegal = (doc: "privacy" | "terms") => {
    if (tourOpen) closeTour();
    window.scrollTo({ top: 0 });
    setScreen((current) => ({ kind: "legal", doc, back: current.kind === "legal" ? current.back : current }));
  };
  const go = (page: Page) => {
    setNotice(null);
    setScreen({ kind: "page", page });
  };
  const play = (featured: FeaturedLesson, mode: LessonMode) =>
    setScreen({ kind: "lesson", lesson: buildPlayableLesson(featured.scenario, featured.recipe), mode, origin: { kind: "builtin" } });
  const playLibrary = async (id: string) => {
    setNotice("Opening the lesson…");
    try {
      const lesson = parseLibraryLesson(await library.lesson(id));
      setNotice(null);
      setScreen({ kind: "lesson", lesson: buildPlayableLesson(lesson.scenario, lesson.recipe), mode: "typing", origin: { kind: "library", id } });
    } catch (error) {
      setNotice(error instanceof NotConnectedError ? error.message : "Couldn't open that lesson. It may have been removed.");
    }
  };
  const playById = (lessonId: string) => {
    const found = ALL_LESSONS.find((l) => l.scenario.id === lessonId);
    if (found) play(found, "typing");
  };

  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <div className="app">
        <NavBar
          current={screen.kind === "page" ? screen.page : screen.kind === "legal" ? null : "lessons"}
          onNavigate={go}
          streak={practice.streak}
          account={
            <AccountMenu
              auth={session}
              device={describeDeviceStatus(device.status)}
              onDeviceSetUp={device.setUp}
              streak={practice.streak}
              lessonsDone={practice.lessonsDone}
              xp={practice.xp}
              monitorOpen={monitorOpen}
              onToggleMonitor={() => setMonitorOpen((open) => !open)}
              onShowTour={() => setTourOpen(true)}
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
            {notice && (
              <p className="app-notice" role="status">
                {notice}
              </p>
            )}
            {screen.kind === "page" && screen.page === "community" && (
              <CommunityScreen
                lessons={COMMUNITY_LESSONS}
                onPlay={play}
                library={
                  <LibrarySection
                    auth={session.status}
                    language="es"
                    onPlay={(entry: LibraryEntry) => void playLibrary(entry.id)}
                    onCreate={() => setScreen({ kind: "create" })}
                    onSignIn={session.enabled ? session.signInWithGoogle : undefined}
                  />
                }
              />
            )}
            {screen.kind === "page" && screen.page === "leaderboard" && (
              <LeaderboardScreen
                auth={session.status}
                streak={practice.streak}
                best={practice.best}
                lessonsDone={practice.lessonsDone}
                xp={practice.xp}
                week={practice.week}
                summary={practice.summary}
                language="es"
                lessons={COACH_LESSONS}
                board={board}
                practisedDays={practice.practisedDays}
                onPlayLesson={playById}
                onSignIn={session.enabled ? session.signInWithGoogle : undefined}
              />
            )}
            {screen.kind === "create" && (
              <CreateLessonScreen
                onCancel={() => go("lessons")}
                onReady={(lesson, origin) => setScreen({ kind: "lesson", lesson, mode: "typing", origin })}
                onPlayLibrary={(id) => void playLibrary(id)}
              />
            )}
            {screen.kind === "lesson" && screen.origin.kind === "generated" && (
              <PublishBar
                auth={session.status}
                lesson={screen.origin.lesson}
                topic={screen.origin.topic}
                intents={screen.origin.intents}
                onSignIn={session.enabled ? session.signInWithGoogle : undefined}
              />
            )}
            {screen.kind === "lesson" && (
              <LessonScreen
                key={screen.lesson.scenario.id}
                lesson={screen.lesson}
                initialMode={screen.mode}
                onExit={() => go("lessons")}
                onComplete={practice.finishLesson}
              />
            )}
            {screen.kind === "legal" && screen.doc === "privacy" && <PrivacyPage onBack={() => setScreen(screen.back)} />}
            {screen.kind === "legal" && screen.doc === "terms" && (
              <TermsPage onBack={() => setScreen(screen.back)} onOpenPrivacy={() => openLegal("privacy")} />
            )}
          </main>
          {monitorOpen && (
            <div id="monitor">
              <ModelMonitorPanel onClose={() => setMonitorOpen(false)} />
            </div>
          )}
        </div>

        <footer className="site-footer">
          <button type="button" className="link-button" onClick={() => setTourOpen(true)}>
            How it works
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" className="link-button" onClick={() => openLegal("privacy")}>
            Privacy
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" className="link-button" onClick={() => openLegal("terms")}>
            Terms
          </button>
        </footer>
      </div>

      {tourOpen && (
        <WelcomeTour
          device={device.status}
          onSetUpDevice={device.setUp}
          onOpenPrivacy={() => openLegal("privacy")}
          onOpenTerms={() => openLegal("terms")}
          onClose={closeTour}
        />
      )}
    </>
  );
};
