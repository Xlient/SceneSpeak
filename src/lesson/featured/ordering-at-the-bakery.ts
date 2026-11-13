import type { SceneRecipe } from "../../scene/recipe/scene-recipe";
import { Scenario } from "../../schemas";

// Spanish written by Claude (polite "usted" register, Spain-style euros); needs a native speaker's review.
export const ORDERING_AT_THE_BAKERY = Scenario.parse({
  id: "ordering-at-the-bakery",
  language: "es",
  level: "A1",
  title: "Ordering at the bakery",
  setting: "A sunny little bakery in Cozy Town. Rosa, the baker, is behind the counter with fresh bread rolls.",
  cast: [{ characterId: "baker", role: "baker", name: "Rosa" }],
  goals: [
    { id: "greet", description: "Say good morning" },
    { id: "order-item", description: "Order two bread rolls" },
    { id: "ask-price", description: "Ask how much it is" },
    { id: "thank", description: "Pay and say thank you" },
  ],
  vocab: [
    { word: "buenos días", meaning: "good morning" },
    { word: "¿qué desea?", meaning: "what would you like? (polite)" },
    { word: "quisiera…", meaning: "I would like…" },
    { word: "el panecillo", meaning: "bread roll" },
    { word: "por favor", meaning: "please" },
    { word: "¿algo más?", meaning: "anything else?" },
    { word: "¿cuánto es?", meaning: "how much is it?" },
    { word: "aquí tiene", meaning: "here you go (polite)" },
    { word: "muchas gracias", meaning: "thank you very much" },
  ],
  lines: [
    { id: "l1", speaker: "baker", text: "¡Buenos días! ¿En qué le puedo ayudar?", translation: "Good morning! How can I help you?", animation: "wave", expects: null },
    { id: "l2", speaker: "learner", text: "¡Buenos días!", translation: "Good morning!", animation: "idle", expects: "greet" },
    { id: "l3", speaker: "baker", text: "¿Qué desea hoy? Tenemos pan recién hecho.", translation: "What would you like today? We have freshly baked bread.", animation: "point", expects: null },
    { id: "l4", speaker: "learner", text: "Quisiera dos panecillos, por favor.", translation: "I'd like two bread rolls, please.", animation: "idle", expects: "order-item" },
    { id: "l5", speaker: "baker", text: "¡Claro! Aquí tiene. ¿Algo más?", translation: "Of course! Here you go. Anything else?", animation: "nod", expects: null },
    { id: "l6", speaker: "learner", text: "No, gracias. ¿Cuánto es?", translation: "No, thank you. How much is it?", animation: "idle", expects: "ask-price" },
    { id: "l7", speaker: "baker", text: "Son dos euros con cincuenta.", translation: "That's two euros fifty.", animation: "talk", expects: null },
    { id: "l8", speaker: "learner", text: "Aquí tiene. ¡Muchas gracias!", translation: "Here you go. Thank you very much!", animation: "idle", expects: "thank" },
    { id: "l9", speaker: "baker", text: "¡A usted! Que tenga un buen día.", translation: "Thank you! Have a nice day.", animation: "wave", expects: null },
  ],
});

export const ORDERING_AT_THE_BAKERY_RECIPE: SceneRecipe = {
  room: "bakery",
  character: "baker",
  props: [
    { item: "counter", slot: "counter" },
    { item: "counter", slot: "counter" },
    { item: "bread-roll", slot: "counter-top" },
    { item: "menu", slot: "counter-top" },
    { item: "bread-roll", slot: "counter-top" },
    { item: "big-jar", slot: "counter-top" },
    { item: "oven", slot: "back" },
    { item: "work-table", slot: "back" },
    { item: "oven", slot: "back" },
    { item: "crate-buns", slot: "floor-left" },
    { item: "cafe-table-set", slot: "floor-right" },
  ],
  poses: [],
};
