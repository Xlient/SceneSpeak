export type RecorderState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "recording"; startedAt: number }
  | { status: "denied" }
  | { status: "unsupported" }
  | { status: "error"; message: string };

export type RecorderEvent =
  | { type: "request" }
  | { type: "started"; at: number }
  | { type: "stopped" }
  | { type: "denied" }
  | { type: "unsupported" }
  | { type: "failed"; message: string }
  | { type: "reset" };

export const recorderReducer = (state: RecorderState, event: RecorderEvent): RecorderState => {
  switch (event.type) {
    case "request":
      return state.status === "recording" || state.status === "requesting" || state.status === "unsupported"
        ? state
        : { status: "requesting" };
    case "started":
      return state.status === "requesting" ? { status: "recording", startedAt: event.at } : state;
    case "stopped":
      return state.status === "recording" || state.status === "requesting" ? { status: "idle" } : state;
    case "denied":
      return { status: "denied" };
    case "unsupported":
      return { status: "unsupported" };
    case "failed":
      return { status: "error", message: event.message };
    case "reset":
      return state.status === "unsupported" ? state : { status: "idle" };
  }
};

export const MAX_RECORDING_MS = 15_000;

export const isRecordingSupported = (): boolean =>
  typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia !== undefined && typeof MediaRecorder !== "undefined";
