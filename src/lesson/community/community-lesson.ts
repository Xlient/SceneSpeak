import { z } from "zod";
import { SceneRecipe } from "../../scene/recipe/scene-recipe";
import { Scenario } from "../../schemas";
import { text } from "../../schemas/primitives";
import type { FeaturedLesson } from "../featured/featured-lessons";

// GitHub usernames: letters, digits and single hyphens, up to 39 characters.
const GitHubUser = z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/, "expected a GitHub username");

/** A lesson file in `lessons/<language>/<id>.json`, written by a contributor and reviewed by a mod. */
export const CommunityLesson = z.object({
  scenario: Scenario,
  recipe: SceneRecipe,
  blurb: text(120),
  emoji: z.string().trim().min(1).max(8),
  authors: z.array(GitHubUser).min(1).max(5),
});
export type CommunityLesson = z.infer<typeof CommunityLesson>;

export interface LoadedCommunityLesson extends FeaturedLesson {
  authors: readonly string[];
  path: string;
}

/** Parses bundled lesson files, skipping any that don't validate (CI should have caught them). */
export const loadCommunityLessons = (files: Readonly<Record<string, unknown>>): LoadedCommunityLesson[] =>
  Object.entries(files)
    .toSorted(([a], [b]) => a.localeCompare(b))
    .flatMap(([path, raw]) => {
      const parsed = CommunityLesson.safeParse(raw);
      if (!parsed.success) return [];
      const { scenario, recipe, blurb, emoji, authors } = parsed.data;
      return [{ scenario, recipe, blurb, emoji, authors, path }];
    });
