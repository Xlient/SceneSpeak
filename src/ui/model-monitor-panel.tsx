import { useSyncExternalStore } from "react";
import type { ModelEvent } from "../monitor/model-monitor";
import { summarize } from "../monitor/model-monitor";
import { useServices } from "./services-context";

const TASK_LABEL: Record<ModelEvent["task"], string> = {
  grade: "Grade reply",
  "grade-voice": "Grade voice",
  screen: "Check request",
  match: "Find similar lesson",
  generate: "Write lesson",
  paint: "Paint backdrop",
  speak: "Character voice",
  explain: "Grammar breakdown",
  coach: "Weekly coach",
};

const ms = (value: number | null) => (value === null ? "–" : `${value} ms`);

export const ModelMonitorPanel = ({ onClose }: { onClose: () => void }) => {
  const { monitor } = useServices();
  const events = useSyncExternalStore(monitor.subscribe, monitor.events);
  const summary = summarize(events);

  return (
    <aside className="card monitor" aria-labelledby="monitor-title">
      <div className="monitor-head">
        <h2 id="monitor-title">Model Monitor</h2>
        <button type="button" className="secondary small" onClick={onClose}>
          Close
        </button>
      </div>
      <dl className="monitor-stats">
        <div>
          <dt>On device</dt>
          <dd>{summary.onDevice}</dd>
        </div>
        <div>
          <dt>Cloud</dt>
          <dd>{summary.inCloud}</dd>
        </div>
        <div>
          <dt>Cloud calls saved</dt>
          <dd>{summary.cloudCallsSaved}</dd>
        </div>
        <div>
          <dt>Avg on device</dt>
          <dd>{ms(summary.avgLatencyMs.on_device)}</dd>
        </div>
        <div>
          <dt>Avg cloud</dt>
          <dd>{ms(summary.avgLatencyMs.in_cloud)}</dd>
        </div>
        <div>
          <dt>Failed</dt>
          <dd>{summary.failures}</dd>
        </div>
      </dl>
      {events.length === 0 ? (
        <p className="audio-note">No AI calls yet. Cached voice clips and backdrops don't count as calls.</p>
      ) : (
        <table className="monitor-table">
          <caption className="visually-hidden">Recent AI calls, newest first</caption>
          <thead>
            <tr>
              <th scope="col">Task</th>
              <th scope="col">Ran</th>
              <th scope="col">Time</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{TASK_LABEL[event.task]}</td>
                <td>
                  <span className={`badge ${event.source === "on_device" ? "device" : "cloud"}`}>
                    {event.source === "on_device" ? "Device" : "Cloud"}
                  </span>
                  {event.route && <span className="monitor-route">{event.route}</span>}
                </td>
                <td>{Math.round(event.latencyMs)} ms</td>
                <td>{event.ok ? "OK" : "Failed"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </aside>
  );
};
