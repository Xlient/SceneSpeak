import { NotConnectedError } from "../services/not-connected";
import type { Grade, Line, Scenario } from "../schemas";

export type InferenceSource = "on_device" | "in_cloud";

export interface GradeRequest {
  scenario: Scenario;
  line: Line;
  reply: string;
  signal: AbortSignal;
}

export interface GradeResult {
  grade: Grade;
  source: InferenceSource;
  /** What the model heard, for voice replies. */
  transcript?: string;
  /** Why it ran where it did (Y4 routing), for the Model Monitor. */
  route?: string;
}

export type Grader = (request: GradeRequest) => Promise<GradeResult>;

export class GraderUnavailableError extends NotConnectedError {
  override readonly name = "GraderUnavailableError";

  constructor() {
    super("Grading isn't connected yet.");
  }
}

export const unavailableGrader: Grader = () => Promise.reject(new GraderUnavailableError());
