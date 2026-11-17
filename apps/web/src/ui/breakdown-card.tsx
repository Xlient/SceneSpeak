import type { BreakdownState } from "./use-breakdown";

const SOURCE_LABEL = { on_device: "On device", in_cloud: "Cloud" } as const;

/** The full breakdown in the side panel: readable without hovering, and announced to screen readers. */
export const BreakdownCard = ({ state }: { state: BreakdownState }) => {
  if (state.status === "idle") return null;
  return (
    <section className="breakdown-card" aria-live="polite" aria-labelledby="breakdown-title">
      <h3 id="breakdown-title">
        🧩 How it's built
        {state.status === "ready" && <span className={`badge ${state.source === "on_device" ? "device" : "cloud"}`}>{SOURCE_LABEL[state.source]}</span>}
      </h3>
      {state.status === "loading" && <p className="audio-note">Breaking it down on your device…</p>}
      {state.status === "failed" && <p className="audio-note">{state.message}</p>}
      {state.status === "ready" && (
        <>
          <ul className="breakdown-words">
            {state.breakdown.words.map((word, i) => (
              <li key={i} className={`role-${word.role}`}>
                <span className="breakdown-word">{word.text}</span> <span className="breakdown-role">{word.role}</span> {word.meaning}
                {word.note && <span className="word-note">{word.note}</span>}
              </li>
            ))}
          </ul>
          <p className="breakdown-structure">
            <strong>Compared with English:</strong> {state.breakdown.structure}
          </p>
        </>
      )}
    </section>
  );
};
