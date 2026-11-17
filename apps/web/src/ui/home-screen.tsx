import type { LoadedCommunityLesson } from "@scenespeak/core/lesson/community/community-lesson";
import type { FeaturedLesson } from "@scenespeak/core/lesson/featured/featured-lessons";
import type { LessonMode } from "@scenespeak/core/lesson/lesson-mode";

const LANGUAGE_NAMES = new Intl.DisplayNames(["en"], { type: "language" });
export const languageName = (code: string) => LANGUAGE_NAMES.of(code) ?? code;

export const LessonCard = ({ lesson, onPlay, credit }: { lesson: FeaturedLesson; onPlay: (lesson: FeaturedLesson, mode: LessonMode) => void; credit?: string }) => (
  <li className="card lesson-card">
    <span className="lesson-emoji" aria-hidden="true">
      {lesson.emoji}
    </span>
    <h3>{lesson.scenario.title}</h3>
    <p>{lesson.blurb}</p>
    <p className="pill small-pill">
      {languageName(lesson.scenario.language)} · {lesson.scenario.level}
    </p>
    {credit && <p className="lesson-credit">{credit}</p>}
    <div className="lesson-play-buttons">
      <button type="button" onClick={() => onPlay(lesson, "typing")} aria-label={`Play ${lesson.scenario.title}`}>
        Play
      </button>
      <button type="button" className="secondary" onClick={() => onPlay(lesson, "speaking")} aria-label={`Speak ${lesson.scenario.title}`}>
        🎙️ Speak
      </button>
    </div>
  </li>
);

export interface HomeScreenProps {
  featured: readonly FeaturedLesson[];
  community: readonly LoadedCommunityLesson[];
  onPlay: (lesson: FeaturedLesson, mode: LessonMode) => void;
  onCreate: () => void;
  onBrowseCommunity: () => void;
}

export const HomeScreen = ({ featured, community, onPlay, onCreate, onBrowseCommunity }: HomeScreenProps) => (
  <section className="home" aria-labelledby="home-title">
    <div className="card create-card">
      <div>
        <h2 id="home-title">What conversation do you need?</h2>
        <p>Type a situation, like "opening a bank account". SceneSpeak builds a little 3D scene and a 5-minute lesson for it.</p>
      </div>
      <button type="button" className="big" onClick={onCreate}>
        ✨ Create a lesson
      </button>
    </div>

    <h2 className="section-title">Featured lessons</h2>
    <ul className="lesson-grid">
      {featured.map((lesson) => (
        <LessonCard key={lesson.scenario.id} lesson={lesson} onPlay={onPlay} />
      ))}
    </ul>

    {community.length > 0 && (
      <p className="section-more">
        <button type="button" className="link-button" onClick={onBrowseCommunity}>
          See {community.length} community {community.length === 1 ? "lesson" : "lessons"} →
        </button>
      </p>
    )}
  </section>
);
