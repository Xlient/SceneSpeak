import { GradeParseError } from "@scenespeak/core/ai/grade-parse";
import { capPartialReply } from "@scenespeak/core/ai/quick-grade";
import { parseVoiceGrade } from "@scenespeak/core/ai/voice-grade-parse";
import { VOICE_GRADE_JSON_SCHEMA, VOICE_GRADE_SYSTEM_INSTRUCTION, buildVoiceGradePrompt } from "@scenespeak/core/ai/voice-grade-prompt";
import type { GradeResult } from "@scenespeak/core/lesson/grader";
import { routeAiCall } from "@scenespeak/core/routing/route";
import { NotConnectedError } from "@scenespeak/core/services/not-connected";
import type { Line, Scenario } from "@scenespeak/core/schemas";
import { GenerateResult, type HybridModel, type InlineAudio } from "../ai-port/hybrid-model";

/** Same as the web app's: audio is slower to upload and process than text. */
export const VOICE_GRADE_TIMEOUT_MS = 25_000;

export class VoiceOfflineError extends NotConnectedError {
  override readonly name = "VoiceOfflineError";

  constructor() {
    super("Voice replies need an internet connection. You can still type your reply.");
  }
}

export interface MobileVoiceRequest {
  scenario: Scenario;
  line: Line;
  audio: InlineAudio;
  signal: AbortSignal;
}

export type MobileVoiceGrader = (request: MobileVoiceRequest) => Promise<GradeResult>;

/**
 * Mirrors the web's createLiveVoiceGrader + createModelVoiceGrader over the native port. Phones record
 * straight to a Gemini audio format, so there's no re-encoding step. The audio lives only in this call.
 */
export const createMobileVoiceGrader = ({ port, isOnline }: { port: HybridModel; isOnline: () => boolean }): MobileVoiceGrader => async (request) => {
  if (!isOnline()) throw new VoiceOfflineError();
  // Device state doesn't matter: the capability rule sends audio to the cloud before it's read.
  const route = routeAiCall({ task: "grade-voice", device: "not-supported", language: request.scenario.language, online: true });
  const prompt = buildVoiceGradePrompt(request);
  const attempt = async (): Promise<GradeResult> => {
    const raw: unknown = await port.generate(
      {
        prompt,
        mode: route.mode,
        systemInstruction: VOICE_GRADE_SYSTEM_INSTRUCTION,
        schemaId: "voice-grade",
        responseSchema: VOICE_GRADE_JSON_SCHEMA,
        audio: request.audio,
      },
      { signal: request.signal, timeoutMs: VOICE_GRADE_TIMEOUT_MS },
    );
    const result = GenerateResult.parse(raw);
    const { grade, transcript } = parseVoiceGrade(result.text, request.line);
    return { grade: capPartialReply(grade, request.line, transcript), transcript, source: result.inferenceSource, route: route.reason };
  };
  try {
    return await attempt();
  } catch (error) {
    if (error instanceof GradeParseError) return attempt();
    throw error;
  }
};
