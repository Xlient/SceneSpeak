import { createUnavailableModel } from "./unavailable-model";

// Expo web: the shipping web app (apps/web) runs Gemini Nano through firebase/ai in Chrome.
export const deviceModel = createUnavailableModel("In a browser, on-device AI runs in the SceneSpeak web app in desktop Chrome.");
