import type { SceneRecipe } from "../../scene/recipe/scene-recipe";
import type { Scenario } from "../../schemas";
import { MEET_THE_NEIGHBOUR, MEET_THE_NEIGHBOUR_RECIPE } from "./meet-the-neighbour";
import { ORDERING_AT_THE_BAKERY, ORDERING_AT_THE_BAKERY_RECIPE } from "./ordering-at-the-bakery";

export interface FeaturedLesson {
  scenario: Scenario;
  recipe: SceneRecipe;
  blurb: string;
  emoji: string;
}

export const FEATURED_LESSONS: readonly FeaturedLesson[] = [
  { scenario: MEET_THE_NEIGHBOUR, recipe: MEET_THE_NEIGHBOUR_RECIPE, blurb: "Say hi, give your name and where you're from.", emoji: "🪚" },
  { scenario: ORDERING_AT_THE_BAKERY, recipe: ORDERING_AT_THE_BAKERY_RECIPE, blurb: "Order bread politely, ask the price and pay.", emoji: "🥐" },
];
