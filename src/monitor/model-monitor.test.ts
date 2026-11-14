import { describe, expect, it } from "vitest";
import { notConnected } from "../services/not-connected";
import { type ModelEvent, createModelMonitor, monitored, summarize } from "./model-monitor";

const event = (overrides: Partial<ModelEvent>): ModelEvent => ({ id: 1, task: "grade", source: "on_device", latencyMs: 100, ok: true, at: 0, ...overrides });

describe("summarize", () => {
  it("counts by source and averages latency", () => {
    const summary = summarize([
      event({ source: "on_device", latencyMs: 100 }),
      event({ source: "on_device", latencyMs: 300 }),
      event({ source: "on_device", ok: false, latencyMs: 50 }),
      event({ source: "in_cloud", latencyMs: 900 }),
    ]);
    expect(summary).toEqual({
      total: 4,
      onDevice: 3,
      inCloud: 1,
      failures: 1,
      avgLatencyMs: { on_device: 150, in_cloud: 900 },
      cloudCallsSaved: 2,
    });
  });

  it("reports no latency without calls", () => {
    expect(summarize([]).avgLatencyMs).toEqual({ on_device: null, in_cloud: null });
  });
});

describe("createModelMonitor", () => {
  it("keeps the newest events up to the limit and notifies", () => {
    const monitor = createModelMonitor(2);
    let calls = 0;
    const unsubscribe = monitor.subscribe(() => calls++);
    for (const latencyMs of [1, 2, 3]) monitor.record({ task: "grade", source: "on_device", latencyMs, ok: true, at: 0 });
    unsubscribe();
    monitor.record({ task: "grade", source: "on_device", latencyMs: 4, ok: true, at: 0 });
    expect(monitor.events().map((e) => e.latencyMs)).toEqual([4, 3]);
    expect(calls).toBe(3);
  });
});

describe("monitored", () => {
  const clock = () => {
    let t = 0;
    return () => (t += 10);
  };

  it("records where a call ran and how long it took", async () => {
    const monitor = createModelMonitor();
    const call = monitored(monitor, "grade", (n: number) => Promise.resolve({ n, source: "in_cloud" as const }), (r) => r.source, "on_device", { now: clock() });
    await call(1);
    expect(monitor.events()[0]).toMatchObject({ task: "grade", source: "in_cloud", latencyMs: 10, ok: true });
  });

  it("records failures and rethrows", async () => {
    const monitor = createModelMonitor();
    const call = monitored(monitor, "paint", () => Promise.reject(new Error("boom")), () => "in_cloud", "in_cloud", { now: clock() });
    await expect(call(undefined)).rejects.toThrow("boom");
    expect(monitor.events()[0]).toMatchObject({ ok: false, source: "in_cloud" });
  });

  it("ignores stubs that aren't connected", async () => {
    const monitor = createModelMonitor();
    const call = monitored(monitor, "speak", () => Promise.reject(notConnected("Voice")), () => "in_cloud", "in_cloud");
    await expect(call(undefined)).rejects.toThrow("isn't connected");
    expect(monitor.events()).toEqual([]);
  });
});
