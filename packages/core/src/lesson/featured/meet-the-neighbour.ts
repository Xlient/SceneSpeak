import type { SceneRecipe } from "../../scene/recipe/scene-recipe";
import { Scenario } from "../../schemas";

export const MEET_THE_NEIGHBOUR = Scenario.parse({
  id: "meet-the-neighbour",
  language: "es",
  level: "A1",
  title: "Meet the neighbour",
  setting: "A cozy wood workshop in Cozy Town. Mateo, the carpenter next door, stops working to say hello.",
  cast: [{ characterId: "carpenter", role: "carpenter", name: "Mateo" }],
  goals: [
    { id: "greet", description: "Say hello" },
    { id: "say-name", description: "Say your name" },
    { id: "say-origin", description: "Say where you're from" },
    { id: "say-goodbye", description: "Say goodbye" },
  ],
  vocab: [
    { word: "hola", meaning: "hi" },
    { word: "me llamo…", meaning: "my name is…" },
    { word: "soy de…", meaning: "I'm from…" },
    { word: "mucho gusto", meaning: "nice to meet you" },
    { word: "hasta luego", meaning: "see you later" },
    { word: "nuevo / nueva", meaning: "new" },
  ],
  lines: [
    { id: "l1", speaker: "carpenter", text: "¡Hola! ¿Eres nuevo en el pueblo?", translation: "Hi! Are you new in town?", animation: "wave", expects: null },
    { id: "l2", speaker: "learner", text: "¡Hola! Sí, soy nuevo.", translation: "Hi! Yes, I'm new.", animation: "idle", expects: "greet" },
    { id: "l3", speaker: "carpenter", text: "¡Bienvenido! Me llamo Mateo. ¿Y tú, cómo te llamas?", translation: "Welcome! My name is Mateo. And you, what's your name?", animation: "talk", expects: null },
    { id: "l4", speaker: "learner", text: "Me llamo Alex.", translation: "My name is Alex.", animation: "idle", expects: "say-name" },
    { id: "l5", speaker: "carpenter", text: "Mucho gusto, Alex. ¿De dónde eres?", translation: "Nice to meet you, Alex. Where are you from?", animation: "nod", expects: null },
    { id: "l6", speaker: "learner", text: "Soy de Estados Unidos.", translation: "I'm from the United States.", animation: "idle", expects: "say-origin" },
    { id: "l7", speaker: "carpenter", text: "¡Qué bien! Bueno, tengo que trabajar. ¡Hasta luego!", translation: "How nice! Well, I have to work. See you later!", animation: "point", expects: null },
    { id: "l8", speaker: "learner", text: "¡Hasta luego, Mateo!", translation: "See you later, Mateo!", animation: "idle", expects: "say-goodbye" },
    { id: "l9", speaker: "carpenter", text: "¡Nos vemos!", translation: "See you!", animation: "wave", expects: null },
  ],
});

export const MEET_THE_NEIGHBOUR_RECIPE: SceneRecipe = {
  room: "wood-workshop",
  character: "carpenter",
  props: [
    { item: "work-table", slot: "counter" },
    { item: "work-table", slot: "counter" },
    { item: "workbench", slot: "back" },
    { item: "cutting-board", slot: "counter-top" },
    { item: "saw", slot: "counter-top" },
    { item: "crate-carrots", slot: "floor-left" },
    { item: "stool", slot: "floor-right" },
  ],
  poses: [],
};
