import type { LoadedCommunityLesson } from "./community-lesson";

export interface Contributor {
  username: string;
  lessons: number;
  languages: string[];
}

/** Everyone credited on a community lesson, most lessons first, then alphabetical. */
export const contributors = (lessons: readonly LoadedCommunityLesson[]): Contributor[] => {
  const byUser = new Map<string, { display: string; lessons: number; languages: Set<string> }>();
  for (const lesson of lessons) {
    for (const author of new Set(lesson.authors.map((a) => a.toLowerCase()))) {
      const display = lesson.authors.find((a) => a.toLowerCase() === author) ?? author;
      const entry = byUser.get(author) ?? { display, lessons: 0, languages: new Set<string>() };
      entry.lessons += 1;
      entry.languages.add(lesson.scenario.language);
      byUser.set(author, entry);
    }
  }
  return [...byUser.values()]
    .map((e) => ({ username: e.display, lessons: e.lessons, languages: [...e.languages].toSorted() }))
    .sort((a, b) => b.lessons - a.lessons || a.username.localeCompare(b.username));
};
