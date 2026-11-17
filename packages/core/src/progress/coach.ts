import { z } from "zod";
import type { InferenceSource } from "../lesson/grader";
import { Id, text } from "../schemas/primitives";
import { NotConnectedError } from "../services/not-connected";
import type { WeeklySummary } from "./weekly";

export interface CoachLessonOption {
  id: string;
  title: string;
  level: string;
}

export interface CoachRequest {
  summary: WeeklySummary;
  language: string;
  /** Lessons the coach may suggest; it must pick one of these IDs or none. */
  lessons: readonly CoachLessonOption[];
  signal: AbortSignal;
}

export const CoachNote = z.object({
  /** Two short, friendly sentences about the week. */
  recap: text(280),
  tip: text(180),
  nextLessonId: Id.nullable().catch(null),
});
export type CoachNote = z.infer<typeof CoachNote>;

export interface CoachResult {
  note: CoachNote;
  source: InferenceSource;
  /** Why it ran where it did, for the Model Monitor. */
  route?: string;
}

/** Writes the weekly recap from local stats. Meant to run only on device, so practice habits stay private. */
export type PracticeCoach = (request: CoachRequest) => Promise<CoachResult>;

export const unavailableCoach: PracticeCoach = () => Promise.reject(new NotConnectedError("The practice coach isn't connected yet."));

/** Drops a suggested lesson the model made up. */
export const validSuggestion = (note: CoachNote, lessons: readonly CoachLessonOption[]): CoachLessonOption | undefined =>
  lessons.find((lesson) => lesson.id === note.nextLessonId);
