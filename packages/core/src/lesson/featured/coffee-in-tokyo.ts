import type { SceneRecipe } from "../../scene/recipe/scene-recipe";
import { Scenario } from "../../schemas";
import { COFFEE_AT_THE_CAFE_RECIPE } from "./coffee-at-the-cafe";

// Japanese written by Claude (polite です/ます shop register); needs a native speaker's review.
export const COFFEE_IN_TOKYO = Scenario.parse({
  id: "coffee-in-tokyo",
  language: "ja",
  level: "A1",
  title: "Coffee in Tokyo",
  setting: "A small coffee shop on a quiet Tokyo street. Yuki, the barista, waits behind the counter.",
  cast: [{ characterId: "barista", role: "barista", name: "Yuki" }],
  goals: [
    { id: "order-drink", description: "Ask for a coffee" },
    { id: "choose-hot", description: "Say you'd like it hot" },
    { id: "pay", description: "Hand over the money and say thank you" },
  ],
  vocab: [
    { word: "こんにちは (konnichiwa)", meaning: "hello" },
    { word: "コーヒー (kōhī)", meaning: "coffee" },
    { word: "〜をください (… o kudasai)", meaning: "… please (asking for something)" },
    { word: "ホット (hotto)", meaning: "hot (drinks)" },
    { word: "お願いします (onegaishimasu)", meaning: "please" },
    { word: "四百円 (yonhyaku en)", meaning: "400 yen" },
    { word: "どうぞ (dōzo)", meaning: "here you go" },
    { word: "ありがとうございます (arigatō gozaimasu)", meaning: "thank you (polite)" },
  ],
  lines: [
    { id: "l1", speaker: "barista", text: "いらっしゃいませ！ご注文は？", translation: "Welcome! What would you like?", animation: "wave", expects: null },
    { id: "l2", speaker: "learner", text: "こんにちは。コーヒーをください。", translation: "Hello. A coffee, please.", animation: "idle", expects: "order-drink" },
    { id: "l3", speaker: "barista", text: "はい。ホットとアイス、どちらにしますか？", translation: "Sure. Hot or iced?", animation: "think", expects: null },
    { id: "l4", speaker: "learner", text: "ホットでお願いします。", translation: "Hot, please.", animation: "idle", expects: "choose-hot" },
    { id: "l5", speaker: "barista", text: "かしこまりました。四百円です。", translation: "Certainly. That's 400 yen.", animation: "nod", expects: null },
    { id: "l6", speaker: "learner", text: "はい、どうぞ。ありがとうございます。", translation: "Here you go. Thank you.", animation: "idle", expects: "pay" },
    { id: "l7", speaker: "barista", text: "ありがとうございました！", translation: "Thank you very much!", animation: "wave", expects: null },
  ],
});

export const COFFEE_IN_TOKYO_RECIPE: SceneRecipe = COFFEE_AT_THE_CAFE_RECIPE;
