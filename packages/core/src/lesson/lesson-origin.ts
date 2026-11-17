import type { Intent } from "../schemas";
import type { GeneratedLesson } from "./generator";

/** Where the lesson being played came from; generated ones can be shared to the library. */
export type LessonOrigin =
  | { kind: "builtin" }
  | { kind: "generated"; lesson: GeneratedLesson; topic: string; intents: readonly Intent[] }
  | { kind: "library"; id: string };
