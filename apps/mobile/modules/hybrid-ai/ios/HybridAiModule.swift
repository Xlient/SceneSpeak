import ExpoModulesCore
import FirebaseAILogic
import FirebaseAppCheck
import FirebaseCore
import Foundation

private let cloudModelName = "gemini-3.5-flash-lite"
private let onDeviceModelVersion = "apple-foundation-models-system-language-model"
private let maxTimeoutMs = 120_000.0

// Firebase AI Logic hybrid inference: Apple Foundation Models on device, Gemini in the cloud.
// Mirrors HybridModel in src/ai-port/hybrid-model.ts; results are plain dictionaries the JS side parses with Zod.
public class HybridAiModule: Module {
  public func definition() -> ModuleDefinition {
    Name("HybridAi")

    OnCreate { configureFirebase() }

    AsyncFunction("status") { (timeoutMs: Double) async throws -> [String: Any] in
      try await bounded(timeoutMs) { statusInfo() }
    }

    // iOS owns the model download (it comes with Apple Intelligence), so this only reports the status.
    AsyncFunction("download") { (timeoutMs: Double) async throws -> [String: Any] in
      try await bounded(timeoutMs) { statusInfo() }
    }

    AsyncFunction("warmUp") { (_: Double) in }

    AsyncFunction("generate") { (request: [String: Any], timeoutMs: Double) async throws -> [String: Any] in
      try await bounded(timeoutMs) { try await generate(request) }
    }
  }
}

// MARK: - Setup

private func configureFirebase() {
  guard FirebaseApp.app() == nil,
        Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil else { return }
  // Sideloaded test builds can't attest, so they carry a debug token registered in the Firebase console.
  if let token = Bundle.main.object(forInfoDictionaryKey: "SceneSpeakAppCheckDebugToken") as? String, !token.isEmpty {
    setenv("FIRAAppCheckDebugToken", token, 1)
    AppCheck.setAppCheckProviderFactory(AppCheckDebugProviderFactory())
  } else {
    #if DEBUG
      AppCheck.setAppCheckProviderFactory(AppCheckDebugProviderFactory())
    #else
      AppCheck.setAppCheckProviderFactory(AppAttestFactory())
    #endif
  }
  FirebaseApp.configure()
}

private final class AppAttestFactory: NSObject, AppCheckProviderFactory {
  func createProvider(with app: FirebaseApp) -> AppCheckProvider? {
    AppAttestProvider(app: app)
  }
}

private func requireFirebase() throws -> FirebaseAI {
  guard FirebaseApp.app() != nil else {
    throw HybridAiError("ERR_NOT_CONFIGURED", "Firebase isn't set up in this build: add GoogleService-Info.plist and rebuild.")
  }
  return FirebaseAI.firebaseAI(backend: .googleAI())
}

// MARK: - Status

private func statusInfo() -> [String: Any] {
  guard #available(iOS 26.0, *) else {
    return ["status": "unavailable", "reason": "On-device AI needs iOS 26 or later."]
  }
  switch FirebaseAI.SystemLanguageModel.default.availability {
  case .available:
    return ["status": "available", "modelName": "apple-foundation"]
  case .unavailable(.modelNotReady):
    return ["status": "downloading", "reason": "Apple Intelligence is still downloading its model."]
  case .unavailable(.appleIntelligenceNotEnabled):
    return ["status": "unavailable", "reason": "Turn on Apple Intelligence in Settings to grade on this iPhone."]
  case .unavailable(.deviceNotEligible):
    return ["status": "unavailable", "reason": "This iPhone doesn't support Apple Intelligence."]
  default:
    return ["status": "unavailable", "reason": "Apple Intelligence isn't available right now."]
  }
}

// MARK: - Generate

private func generate(_ request: [String: Any]) async throws -> [String: Any] {
  guard let prompt = request["prompt"] as? String else { throw HybridAiError("ERR_BAD_REQUEST", "Missing prompt.") }
  let system = request["systemInstruction"] as? String
  let schema = (request["responseSchema"] as? [String: Any]).map(toSchema)
  let audio = try (request["audio"] as? [String: Any]).map(parseAudio)
  // The on-device model takes no audio, so a voice reply always goes to the cloud.
  let mode = audio == nil ? (request["mode"] as? String ?? "prefer_on_device") : "only_in_cloud"
  let ai = try requireFirebase()
  let started = Date()

  do {
    if mode == "only_in_cloud" {
      return try await cloudOnly(ai, prompt: prompt, system: system, schema: schema, audio: audio, started: started)
    }
    return try await hybrid(ai, mode: mode, prompt: prompt, system: system, schema: schema,
                            schemaJSON: request["responseSchema"] as? [String: Any], started: started)
  } catch let error as HybridAiError {
    throw error
  } catch {
    throw HybridAiError("ERR_GENERATE", String(error.localizedDescription.prefix(200)))
  }
}

private func cloudOnly(_ ai: FirebaseAI, prompt: String, system: String?, schema: Schema?, audio: InlineDataPart?,
                       started: Date) async throws -> [String: Any] {
  let config = schema.map { GenerationConfig(responseMIMEType: "application/json", responseSchema: $0) }
  let model = ai.generativeModel(modelName: cloudModelName, generationConfig: config,
                                 systemInstruction: system.map { ModelContent(role: "system", parts: $0) })
  let response: GenerateContentResponse
  if let audio {
    response = try await model.generateContent(prompt, audio)
  } else {
    response = try await model.generateContent(prompt)
  }
  guard let text = response.text else { throw HybridAiError("ERR_EMPTY", "The model returned no text.") }
  return result(text: text, onDevice: false, started: started)
}

// Prefer/only on-device go through a GenerativeModelSession; one session per call keeps requests single-turn.
private func hybrid(_ ai: FirebaseAI, mode: String, prompt: String, system: String?, schema: Schema?,
                    schemaJSON: [String: Any]?, started: Date) async throws -> [String: Any] {
  let device = FirebaseAI.SystemLanguageModel.default
  let cloud = ai.geminiModel(name: cloudModelName)
  // Foundation Models can't take the schema here, so the on-device side is asked for it in plain words.
  let instructions = [system, schemaJSON.flatMap(schemaInstruction)].compactMap { $0 }.joined(separator: "\n\n")
  let session: GenerativeModelSession
  switch mode {
  case "only_on_device":
    session = ai.generativeModelSession(model: device, instructions: instructions)
  case "prefer_in_cloud":
    session = ai.generativeModelSession(model: HybridModel(primary: cloud, secondary: device), instructions: instructions)
  default:
    session = ai.generativeModelSession(model: HybridModel(primary: device, secondary: cloud), instructions: instructions)
  }
  let gemini = schema.map { GenerationConfig(responseMIMEType: "application/json", responseSchema: $0) } ?? GenerationConfig()
  let response = try await session.respond(to: prompt, options: .hybrid(gemini: gemini, foundationModels: FirebaseAI.GenerationOptions()))
  return result(text: response.content, onDevice: response.rawResponse.modelVersion == onDeviceModelVersion, started: started)
}

private func schemaInstruction(_ json: [String: Any]) -> String? {
  guard let data = try? JSONSerialization.data(withJSONObject: json, options: [.sortedKeys]),
        let text = String(data: data, encoding: .utf8) else { return nil }
  return "Reply with only one JSON object, no markdown, that matches this JSON schema:\n\(text)"
}

private func parseAudio(_ audio: [String: Any]) throws -> InlineDataPart {
  guard let mime = audio["mimeType"] as? String else { throw HybridAiError("ERR_BAD_REQUEST", "Missing audio mimeType.") }
  guard let base64 = audio["data"] as? String, let data = Data(base64Encoded: base64) else {
    throw HybridAiError("ERR_BAD_REQUEST", "Missing audio data.")
  }
  return InlineDataPart(data: data, mimeType: mime)
}

private func result(text: String, onDevice: Bool, started: Date) -> [String: Any] {
  ["text": text, "inferenceSource": onDevice ? "on_device" : "in_cloud", "latencyMs": Date().timeIntervalSince(started) * 1000]
}

// MARK: - Helpers

private func bounded<T: Sendable>(_ timeoutMs: Double, _ work: @escaping @Sendable () async throws -> T) async throws -> T {
  let ms = min(max(timeoutMs, 1), maxTimeoutMs)
  return try await withThrowingTaskGroup(of: T.self) { group in
    group.addTask { try await work() }
    group.addTask {
      try await Task.sleep(nanoseconds: UInt64(ms * 1_000_000))
      throw HybridAiError("ERR_TIMEOUT", "The AI call took longer than \(Int(ms))ms.")
    }
    defer { group.cancelAll() }
    guard let first = try await group.next() else { throw HybridAiError("ERR_TIMEOUT", "The AI call didn't finish.") }
    return first
  }
}

final class HybridAiError: GenericException<(code: String, message: String)>, @unchecked Sendable {
  convenience init(_ code: String, _ message: String) {
    self.init((code: code, message: message))
  }

  override var code: String { param.code }
  override var reason: String { param.message }
}
