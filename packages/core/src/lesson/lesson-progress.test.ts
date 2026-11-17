import { describe, expect, it } from "vitest";
import type { Grade } from "../schemas";
import { MEET_THE_NEIGHBOUR as scenario } from "./featured/meet-the-neighbour";
import type { GradeResult } from "./grader";
import { type LessonAction, type LessonState, characterAnimation, initialLessonState, lessonReducer } from "./lesson-progress";

const reduce = lessonReducer(scenario);
const run = (...actions: LessonAction[]): LessonState => actions.reduce(reduce, initialLessonState(scenario));

const grade = (ok: boolean): Grade => ({
  ok,
  meaningMatches: ok,
  score: ok ? 90 : 30,
  correction: null,
  hint: null,
  goalId: null,
  errorType: ok ? "none" : "grammar",
});
const result = (ok: boolean): GradeResult => ({ grade: grade(ok), source: "on_device" });

describe("lessonReducer", () => {
  it("starts by listening to the first character line", () => {
    expect(initialLessonState(scenario)).toMatchObject({ lineIndex: 0, phase: "listening" });
  });

  it("moves to replying on the learner's line", () => {
    expect(run({ type: "next" })).toMatchObject({ lineIndex: 1, phase: "replying" });
  });

  it("completes the line's goal when the grade is ok", () => {
    const state = run({ type: "next" }, { type: "submit" }, { type: "graded", result: result(true) });
    expect(state.phase).toBe("feedback");
    expect(state.completedGoalIds).toEqual(["greet"]);
  });

  it("records every graded try for scoring", () => {
    const state = run({ type: "next" }, { type: "submit" }, { type: "graded", result: result(false) }, { type: "retry" }, { type: "submit" }, { type: "graded", result: result(true) });
    expect(state.attempts).toEqual([
      { lineId: "l2", score: 30, ok: false },
      { lineId: "l2", score: 90, ok: true },
    ]);
  });

  it("does not complete the goal when the grade is not ok, and allows a retry", () => {
    const state = run({ type: "next" }, { type: "submit" }, { type: "graded", result: result(false) }, { type: "retry" });
    expect(state.completedGoalIds).toEqual([]);
    expect(state.phase).toBe("replying");
  });

  it("returns to replying with an error when grading fails", () => {
    const state = run({ type: "next" }, { type: "submit" }, { type: "gradeFailed", message: "offline" });
    expect(state).toMatchObject({ phase: "replying", error: "offline" });
  });

  it("ignores actions that don't fit the phase", () => {
    const start = initialLessonState(scenario);
    expect(reduce(start, { type: "submit" })).toBe(start);
    expect(reduce(start, { type: "continue" })).toBe(start);
  });

  it("finishes after the last line", () => {
    const actions: LessonAction[] = [];
    for (const line of scenario.lines) {
      if (line.speaker === "learner") actions.push({ type: "submit" }, { type: "graded", result: result(true) }, { type: "continue" });
      else actions.push({ type: "next" });
    }
    const state = run(...actions);
    expect(state.phase).toBe("done");
    expect(state.completedGoalIds).toEqual(["greet", "say-name", "say-origin", "say-goodbye"]);
  });
});

describe("characterAnimation", () => {
  it("uses the line's animation while listening and thinks while grading", () => {
    expect(characterAnimation(scenario, initialLessonState(scenario))).toBe("wave");
    expect(characterAnimation(scenario, run({ type: "next" }, { type: "submit" }))).toBe("think");
  });
});
