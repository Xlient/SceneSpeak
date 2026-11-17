import { GradeParseError } from "@scenespeak/core/ai/grade-parse";
import { AiTimeoutError } from "@scenespeak/core/ai/with-timeout";
import { NotConnectedError } from "@scenespeak/core/services/not-connected";
import { HybridModelUnavailableError } from "../ai-port/hybrid-model";

export const gradeErrorMessage = (error: unknown, reply: "text" | "voice" = "text"): string => {
  if (error instanceof AiTimeoutError) return "Grading took too long. Please try again.";
  if (error instanceof GradeParseError) return "The grader got mixed up on that one. Please try again.";
  if (error instanceof HybridModelUnavailableError) {
    // Exact typed phrases are graded without a model; spoken replies always need one.
    return reply === "voice"
      ? "Voice grading isn't connected in the app yet. Tap Type instead and type the example phrase."
      : "AI grading isn't connected in the app yet. Exact answers still count: try the example phrase.";
  }
  if (error instanceof NotConnectedError) return error.message;
  return "Grading failed. Check your connection and try again.";
};
