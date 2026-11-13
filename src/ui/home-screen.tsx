import type { FeaturedLesson } from "../lesson/featured/featured-lessons";

export interface HomeScreenProps {
  featured: readonly FeaturedLesson[];
  onPlay: (lesson: FeaturedLesson) => void;
  onCreate: () => void;
}

export const HomeScreen = ({ featured, onPlay, onCreate }: HomeScreenProps) => (
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
        <li key={lesson.scenario.id} className="card lesson-card">
          <span className="lesson-emoji" aria-hidden="true">
            {lesson.emoji}
          </span>
          <h3>{lesson.scenario.title}</h3>
          <p>{lesson.blurb}</p>
          <p className="pill small-pill">Spanish · {lesson.scenario.level}</p>
          <button type="button" onClick={() => onPlay(lesson)} aria-label={`Play ${lesson.scenario.title}`}>
            Play
          </button>
        </li>
      ))}
    </ul>
  </section>
);
