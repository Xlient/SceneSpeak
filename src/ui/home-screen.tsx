import type { LoadedCommunityLesson } from "../lesson/community/community-lesson";
import type { FeaturedLesson } from "../lesson/featured/featured-lessons";

const LANGUAGE_NAMES = new Intl.DisplayNames(["en"], { type: "language" });
const languageName = (code: string) => LANGUAGE_NAMES.of(code) ?? code;

const LessonCard = ({ lesson, onPlay, credit }: { lesson: FeaturedLesson; onPlay: (lesson: FeaturedLesson) => void; credit?: string }) => (
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
    <button type="button" onClick={() => onPlay(lesson)} aria-label={`Play ${lesson.scenario.title}`}>
      Play
    </button>
  </li>
);

export interface HomeScreenProps {
  featured: readonly FeaturedLesson[];
  community: readonly LoadedCommunityLesson[];
  onPlay: (lesson: FeaturedLesson) => void;
  onCreate: () => void;
}

export const HomeScreen = ({ featured, community, onPlay, onCreate }: HomeScreenProps) => (
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
      <>
        <h2 className="section-title">Community lessons</h2>
        <ul className="lesson-grid">
          {community.map((lesson) => (
            <LessonCard key={lesson.path} lesson={lesson} onPlay={onPlay} credit={`By ${lesson.authors.join(", ")}`} />
          ))}
        </ul>
      </>
    )}
  </section>
);
