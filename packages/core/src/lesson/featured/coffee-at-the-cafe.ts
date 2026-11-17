import type { SceneRecipe } from "../../scene/recipe/scene-recipe";
import { Scenario } from "../../schemas";

// Spanish written by Claude (informal "tú", common in Spanish cafés); needs a native speaker's review.
export const COFFEE_AT_THE_CAFE = Scenario.parse({
  id: "coffee-at-the-cafe",
  language: "es",
  level: "A1",
  title: "Coffee at the café",
  setting: "A cozy corner café in Cozy Town. Leo, the barista, is behind the counter next to a little menu stand.",
  cast: [{ characterId: "barista", role: "barista", name: "Leo" }],
  goals: [
    { id: "order-drink", description: "Order a coffee with milk" },
    { id: "ask-bathroom", description: "Ask where the bathroom is" },
    { id: "pay", description: "Ask how much it is and say thanks" },
  ],
  vocab: [
    { word: "hola", meaning: "hello" },
    { word: "¿qué te pongo?", meaning: "what can I get you? (informal)" },
    { word: "un café con leche", meaning: "a coffee with milk" },
    { word: "para tomar aquí", meaning: "to have here" },
    { word: "¿dónde está…?", meaning: "where is…?" },
    { word: "el baño", meaning: "the bathroom" },
    { word: "al fondo", meaning: "at the back" },
    { word: "¿cuánto es?", meaning: "how much is it?" },
    { word: "gracias", meaning: "thank you" },
  ],
  lines: [
    { id: "l1", speaker: "barista", text: "¡Hola! ¿Qué te pongo?", translation: "Hi! What can I get you?", animation: "wave", expects: null },
    { id: "l2", speaker: "learner", text: "¡Hola! Un café con leche, por favor.", translation: "Hi! A coffee with milk, please.", animation: "idle", expects: "order-drink" },
    { id: "l3", speaker: "barista", text: "Muy bien. ¿Para tomar aquí o para llevar?", translation: "Great. To have here or to take away?", animation: "nod", expects: null },
    { id: "l4", speaker: "learner", text: "Para tomar aquí. ¿Dónde está el baño?", translation: "To have here. Where is the bathroom?", animation: "idle", expects: "ask-bathroom" },
    { id: "l5", speaker: "barista", text: "Está al fondo, a la derecha.", translation: "It's at the back, on the right.", animation: "point", expects: null },
    { id: "l6", speaker: "learner", text: "Gracias. ¿Cuánto es?", translation: "Thanks. How much is it?", animation: "idle", expects: "pay" },
    { id: "l7", speaker: "barista", text: "Un euro con ochenta. ¡Que lo disfrutes!", translation: "One euro eighty. Enjoy!", animation: "talk", expects: null },
  ],
});

export const COFFEE_AT_THE_CAFE_RECIPE: SceneRecipe = {
  room: "shop-counter",
  character: "barista",
  props: [
    { item: "counter", slot: "counter" },
    { item: "counter", slot: "counter" },
    { item: "menu", slot: "counter-top" },
    { item: "plate", slot: "counter-top" },
    { item: "jar", slot: "counter-top" },
    { item: "work-table", slot: "back" },
    { item: "counter", slot: "back" },
    { item: "cafe-table-set", slot: "floor-left" },
    { item: "cafe-table", slot: "floor-right" },
  ],
  poses: [],
};
