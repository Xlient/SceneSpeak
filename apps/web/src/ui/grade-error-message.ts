import { FirebaseConfigError } from "@scenespeak/core/ai/config";
import { GradeParseError } from "@scenespeak/core/ai/grade-parse";
import { AiTimeoutError } from "@scenespeak/core/ai/with-timeout";
import { VoiceOfflineError } from "@scenespeak/core/services/live-voice-grader";
import { NotConnectedError } from "@scenespeak/core/services/not-connected";

export const gradeErrorMessage = (error: unknown): string => {
  if (error instanceof AiTimeoutError) return "Grading took too long. Please try again.";
  if (error instanceof GradeParseError) return "The grader got mixed up on that one. Please try again.";
  if (error instanceof FirebaseConfigError) return "AI grading isn't set up in this copy of SceneSpeak yet.";
  if (error instanceof NotConnectedError || error instanceof VoiceOfflineError) return error.message;
  return "Grading failed. Check your connection and try again.";
};
