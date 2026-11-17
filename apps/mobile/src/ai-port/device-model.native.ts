import { createUnavailableModel } from "./unavailable-model";

// TODO(user): replace with an adapter over modules/hybrid-ai (Gemini Nano on Android, Apple Foundation
// Models on iOS) that implements HybridModel and parses results with the schemas in hybrid-model.ts.
export const deviceModel = createUnavailableModel("On-device AI isn't connected in this version of the app yet.");
