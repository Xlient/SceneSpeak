import type { InferenceSource } from "../lesson/grader";
import { NotConnectedError } from "../services/not-connected";

export const AI_TASKS = ["grade", "grade-voice", "generate", "paint", "speak"] as const;
export type AiTask = (typeof AI_TASKS)[number];

export interface ModelEvent {
  id: number;
  task: AiTask;
  source: InferenceSource;
  latencyMs: number;
  ok: boolean;
  at: number;
  /** Routing reason, when the call was routed (Y4). */
  route?: string;
}

export type NewModelEvent = Omit<ModelEvent, "id">;

export interface ModelMonitor {
  record(event: NewModelEvent): void;
  subscribe(listener: () => void): () => void;
  events(): readonly ModelEvent[];
}

export const createModelMonitor = (limit = 50): ModelMonitor => {
  let events: readonly ModelEvent[] = [];
  let nextId = 1;
  const listeners = new Set<() => void>();
  return {
    record(event) {
      events = [{ ...event, id: nextId++ }, ...events].slice(0, limit);
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    events: () => events,
  };
};

export interface MonitorSummary {
  total: number;
  onDevice: number;
  inCloud: number;
  failures: number;
  avgLatencyMs: Record<InferenceSource, number | null>;
  /** Successful on-device calls: each one would otherwise have been a cloud call. */
  cloudCallsSaved: number;
}

const average = (values: readonly number[]): number | null =>
  values.length === 0 ? null : Math.round(values.reduce((a, b) => a + b, 0) / values.length);

export const summarize = (events: readonly ModelEvent[]): MonitorSummary => {
  const onDevice = events.filter((e) => e.source === "on_device");
  const inCloud = events.filter((e) => e.source === "in_cloud");
  return {
    total: events.length,
    onDevice: onDevice.length,
    inCloud: inCloud.length,
    failures: events.filter((e) => !e.ok).length,
    avgLatencyMs: { on_device: average(onDevice.map((e) => e.latencyMs)), in_cloud: average(inCloud.map((e) => e.latencyMs)) },
    cloudCallsSaved: onDevice.filter((e) => e.ok).length,
  };
};

/**
 * Wraps an AI call so every success or failure lands in the monitor.
 * `sourceOf` reads where it ran (e.g. `response.inferenceSource`); failures count against `failedSource`.
 * Stubs that aren't connected yet aren't recorded.
 */
export const monitored =
  <Req, Res>(
    monitor: ModelMonitor,
    task: AiTask,
    call: (request: Req) => Promise<Res>,
    sourceOf: (result: Res) => InferenceSource,
    failedSource: InferenceSource,
    { routeOf, now = () => performance.now() }: { routeOf?: (result: Res) => string | undefined; now?: () => number } = {},
  ) =>
  async (request: Req): Promise<Res> => {
    const start = now();
    try {
      const result = await call(request);
      const route = routeOf?.(result);
      monitor.record({ task, source: sourceOf(result), latencyMs: now() - start, ok: true, at: Date.now(), ...(route ? { route } : {}) });
      return result;
    } catch (error) {
      if (error instanceof NotConnectedError) throw error;
      monitor.record({ task, source: failedSource, latencyMs: now() - start, ok: false, at: Date.now() });
      throw error;
    }
  };
