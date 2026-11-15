import { z } from "zod";
import type { Grade, Line } from "../schemas";
import { GradeParseError, parseGrade } from "./grade-parse";

const Transcript = z.object({ transcript: z.string().trim().max(600).catch("") });

export interface VoiceGrade {
  grade: Grade;
  transcript: string;
}

/** Grade plus what the model heard. A reply with no speech can never pass, whatever the model says. */
export const parseVoiceGrade = (raw: string, line: Line): VoiceGrade => {
  const grade = parseGrade(raw, line);
  const stripped = raw.replace(/^\s*```(?:json)?\s*/, "").replace(/\s*```\s*$/, "");
  const parsed = Transcript.safeParse(JSON.parse(stripped));
  if (!parsed.success) throw new GradeParseError("Voice grade has no transcript", raw);
  const transcript = parsed.data.transcript;
  if (transcript !== "") return { grade, transcript };
  return {
    transcript,
    grade: { ...grade, ok: false, meaningMatches: false, score: 0, goalId: null, hint: grade.hint ?? "We couldn't hear you. Try again a little closer to the microphone." },
  };
};
