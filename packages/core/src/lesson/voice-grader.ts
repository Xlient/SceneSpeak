import type { VoiceGradeRequest } from "../audio/media-sources";
import { notConnected } from "../services/not-connected";
import type { GradeResult } from "./grader";

/** Y7 plugs in here: cloud Gemini, audio in → transcript + Grade. */
export type VoiceGrader = (request: VoiceGradeRequest) => Promise<GradeResult>;

export const unavailableVoiceGrader: VoiceGrader = () => Promise.reject(notConnected("Voice grading"));
