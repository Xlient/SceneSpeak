import { requireOptionalNativeModule } from "expo";
import { asNativeHybridAi, createNativeModel } from "./native-model";
import { createUnavailableModel } from "./unavailable-model";

// modules/hybrid-ai: Gemini Nano on Android, Apple Foundation Models on iOS, cloud Gemini as the fallback on both.
const native = asNativeHybridAi(requireOptionalNativeModule("HybridAi"));

export const deviceModel = native
  ? createNativeModel(native)
  : createUnavailableModel("On-device AI isn't available in this build of the app.");
