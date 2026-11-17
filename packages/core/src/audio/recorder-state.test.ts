import { describe, expect, it } from "vitest";
import { type RecorderState, recorderReducer } from "./recorder-state";

describe("recorderReducer", () => {
  it("goes idle → requesting → recording → idle", () => {
    let state: RecorderState = { status: "idle" };
    state = recorderReducer(state, { type: "request" });
    expect(state.status).toBe("requesting");
    state = recorderReducer(state, { type: "started", at: 5 });
    expect(state).toEqual({ status: "recording", startedAt: 5 });
    state = recorderReducer(state, { type: "stopped" });
    expect(state.status).toBe("idle");
  });

  it("ignores a second request while recording", () => {
    const recording: RecorderState = { status: "recording", startedAt: 1 };
    expect(recorderReducer(recording, { type: "request" })).toBe(recording);
  });

  it("only starts after a request", () => {
    const idle: RecorderState = { status: "idle" };
    expect(recorderReducer(idle, { type: "started", at: 1 })).toBe(idle);
  });

  it("stays unsupported", () => {
    const unsupported: RecorderState = { status: "unsupported" };
    expect(recorderReducer(unsupported, { type: "request" })).toBe(unsupported);
    expect(recorderReducer(unsupported, { type: "reset" })).toBe(unsupported);
  });

  it("can retry after permission is denied", () => {
    expect(recorderReducer({ status: "denied" }, { type: "request" }).status).toBe("requesting");
  });
});
