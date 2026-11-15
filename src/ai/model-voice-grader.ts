import type { AudioEncoder } from "../audio/wav";
import type { VoiceGrader } from "../lesson/voice-grader";
import { GradeParseError } from "./grade-parse";
import type { AppModel } from "./model";
import { parseVoiceGrade } from "./voice-grade-parse";
import { buildVoiceGradePrompt } from "./voice-grade-prompt";

export type VoiceGradingModel = Pick<AppModel, "generate">;

/** Audio is slower to upload and process than text. */
export const VOICE_GRADE_TIMEOUT_MS = 25_000;

/** The recording lives only in this call: encoded in memory, sent once (twice on a retry), never stored or logged. */
export const createModelVoiceGrader =
  (model: VoiceGradingModel, encode: AudioEncoder): VoiceGrader =>
  async (request) => {
    const audio = await encode(request.audio);
    const prompt = buildVoiceGradePrompt(request);
    const attempt = async () => {
      const result = await model.generate([prompt, { type: "inlineData", inlineData: audio }], {
        signal: request.signal,
        timeoutMs: VOICE_GRADE_TIMEOUT_MS,
      });
      const { grade, transcript } = parseVoiceGrade(result.text, request.line);
      return { grade, transcript, source: result.source ?? "in_cloud" };
    };

    try {
      return await attempt();
    } catch (error) {
      if (error instanceof GradeParseError) return attempt();
      throw error;
    }
  };
