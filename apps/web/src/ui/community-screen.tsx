import type { LoadedCommunityLesson } from "@scenespeak/core/lesson/community/community-lesson";
import { contributors } from "@scenespeak/core/lesson/community/contributors";
import type { FeaturedLesson } from "@scenespeak/core/lesson/featured/featured-lessons";
import { type ReactNode, useState } from "react";
import { type LanguageFilter, languageFilterOptions, matchesLanguage } from "@scenespeak/core/language/language-filter";
import type { LessonMode } from "@scenespeak/core/lesson/lesson-mode";
import { LessonCard, languageName } from "./home-screen";
import { LanguageFilterChips } from "./language-badges";
import { LESSON_GUIDE_URL } from "./links";

export interface CommunityScreenProps {
  lessons: readonly LoadedCommunityLesson[];
  onPlay: (lesson: FeaturedLesson, mode: LessonMode) => void;
  /** The shared lesson library for the chosen language, shown above the reviewed community lessons. */
  library?: (filter: LanguageFilter) => ReactNode;
}

export const CommunityScreen = ({ lessons, onPlay, library }: CommunityScreenProps) => {
  const people = contributors(lessons);
  const [filter, setFilter] = useState<LanguageFilter>(null);
  const shown = lessons.filter((lesson) => matchesLanguage(lesson.scenario.language, filter));
  return (
    <section className="page" aria-labelledby="community-title">
      <div className="page-header">
        <h2 id="community-title">Community</h2>
        <p>Lessons written by learners and teachers around the world, checked by our mods before they go live.</p>
      </div>

      <LanguageFilterChips options={languageFilterOptions(lessons.map((l) => l.scenario.language))} value={filter} onChange={setFilter} />

      {library?.(filter)}

      <h3 className="section-title">Reviewed community lessons</h3>
      {shown.length === 0 ? (
        <p>{filter ? `No reviewed ${languageName(filter)} lessons yet. Write one!` : "No community lessons yet. Be the first!"}</p>
      ) : (
        <ul className="lesson-grid">
          {shown.map((lesson) => (
            <LessonCard key={lesson.path} lesson={lesson} onPlay={onPlay} credit={`By ${lesson.authors.join(", ")}`} />
          ))}
        </ul>
      )}

      <div className="page-columns">
        <section className="card page-card" aria-labelledby="contributors-title">
          <h3 id="contributors-title">Contributors</h3>
          {people.length === 0 ? (
            <p>Nobody yet.</p>
          ) : (
            <ol className="contributor-list">
              {people.map((person) => (
                <li key={person.username}>
                  <span className="avatar small initial" aria-hidden="true">
                    {person.username[0]?.toLocaleUpperCase()}
                  </span>
                  <span className="contributor-name">@{person.username}</span>
                  <span className="contributor-meta">
                    {person.lessons} {person.lessons === 1 ? "lesson" : "lessons"} · {person.languages.map(languageName).join(", ")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card page-card" aria-labelledby="contribute-title">
          <h3 id="contribute-title">Write a lesson</h3>
          <ol className="steps">
            <li>Copy the example lesson file and write your conversation in any language.</li>
            <li>Run the checks. They tell you if a prop doesn't fit or a goal has no line.</li>
            <li>Open a pull request. A mod reviews it, and once merged it appears here.</li>
          </ol>
          <a className="button-link" href={LESSON_GUIDE_URL} target="_blank" rel="noreferrer">
            Read the lesson guide ↗
          </a>
        </section>
      </div>
    </section>
  );
};
