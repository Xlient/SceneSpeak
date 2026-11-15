import { type Animation, LEARNER_SPEAKER, type Line, type Scenario } from "../schemas";
import type { GradeResult } from "./grader";

export type LessonPhase = "listening" | "replying" | "grading" | "feedback" | "done";

/** One graded try at a learner line, kept for scoring. */
export interface Attempt {
  lineId: string;
  score: number;
  ok: boolean;
}

export interface LessonState {
  lineIndex: number;
  phase: LessonPhase;
  completedGoalIds: readonly string[];
  lastResult: GradeResult | null;
  error: string | null;
  attempts: readonly Attempt[];
}

export type LessonAction =
  | { type: "next" }
  | { type: "submit" }
  | { type: "graded"; result: GradeResult }
  | { type: "gradeFailed"; message: string }
  | { type: "retry" }
  | { type: "continue" };

const phaseAt = (scenario: Scenario, lineIndex: number): LessonPhase => {
  const line = scenario.lines[lineIndex];
  if (!line) return "done";
  return line.speaker === LEARNER_SPEAKER ? "replying" : "listening";
};

const moveTo = (scenario: Scenario, state: LessonState, lineIndex: number): LessonState => ({
  ...state,
  lineIndex,
  phase: phaseAt(scenario, lineIndex),
  lastResult: null,
  error: null,
});

export const initialLessonState = (scenario: Scenario): LessonState => ({
  lineIndex: 0,
  phase: phaseAt(scenario, 0),
  completedGoalIds: [],
  lastResult: null,
  error: null,
  attempts: [],
});

export const currentLine = (scenario: Scenario, state: LessonState): Line | undefined => scenario.lines[state.lineIndex];

export const lessonReducer =
  (scenario: Scenario) =>
  (state: LessonState, action: LessonAction): LessonState => {
    switch (action.type) {
      case "next":
        return state.phase === "listening" ? moveTo(scenario, state, state.lineIndex + 1) : state;
      case "submit":
        return state.phase === "replying" ? { ...state, phase: "grading", error: null } : state;
      case "graded": {
        if (state.phase !== "grading") return state;
        const line = currentLine(scenario, state);
        const goalId = line?.expects;
        const attempts = line ? [...state.attempts, { lineId: line.id, score: action.result.grade.score, ok: action.result.grade.ok }] : state.attempts;
        const completed =
          action.result.grade.ok && goalId && !state.completedGoalIds.includes(goalId)
            ? [...state.completedGoalIds, goalId]
            : state.completedGoalIds;
        return { ...state, phase: "feedback", lastResult: action.result, completedGoalIds: completed, attempts };
      }
      case "gradeFailed":
        return state.phase === "grading" ? { ...state, phase: "replying", error: action.message } : state;
      case "retry":
        return state.phase === "feedback" ? { ...state, phase: "replying", lastResult: null } : state;
      case "continue":
        return state.phase === "feedback" ? moveTo(scenario, state, state.lineIndex + 1) : state;
    }
  };

export const characterAnimation = (scenario: Scenario, state: LessonState): Animation => {
  switch (state.phase) {
    case "listening":
      return currentLine(scenario, state)?.animation ?? "idle";
    case "grading":
      return "think";
    case "feedback":
      return state.lastResult?.grade.ok ? "nod" : "think";
    case "done":
      return "wave";
    case "replying":
      return "idle";
  }
};
