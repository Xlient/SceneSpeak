package expo.modules.hybridai

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Firebase AI Logic hybrid inference (Gemini Nano via firebase-ai-ondevice). Functions to add:
// status, download, warmUp, generate — matching HybridModel in src/ai-port/hybrid-model.ts.
class HybridAiModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HybridAi")
  }
}
