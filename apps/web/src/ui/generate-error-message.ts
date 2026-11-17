import { FirebaseConfigError } from "@scenespeak/core/ai/config";
import { UnsafeRequestError } from "@scenespeak/core/ai/lesson-generator";
import { LessonParseError } from "@scenespeak/core/ai/lesson-parse";
import { AiTimeoutError } from "@scenespeak/core/ai/with-timeout";
import { NotConnectedError } from "@scenespeak/core/services/not-connected";

export const generateErrorMessage = (error: unknown): string => {
  if (error instanceof UnsafeRequestError) return `${error.message} Try an everyday situation instead.`;
  if (error instanceof AiTimeoutError) return "Writing the lesson took too long. Please try again.";
  if (error instanceof LessonParseError) return "The lesson came out jumbled. Please try again, or reword your request.";
  if (error instanceof FirebaseConfigError) return "Lesson writing isn't set up in this copy of SceneSpeak yet.";
  if (error instanceof NotConnectedError) return error.message;
  return "Couldn't write the lesson. Check your connection and try again.";
};
