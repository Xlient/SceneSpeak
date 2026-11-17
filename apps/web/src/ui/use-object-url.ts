import { useEffect, useState } from "react";

export type MediaState = { status: "loading" } | { status: "ready"; url: string } | { status: "unavailable"; message: string };

/** Loads a generated blob (TTS clip, backdrop) and exposes it as an object URL, revoked on change. */
export const useGeneratedMedia = (load: ((signal: AbortSignal) => Promise<Blob>) | null, key: string): MediaState => {
  const [state, setState] = useState<{ key: string; value: MediaState }>({ key, value: { status: "loading" } });

  useEffect(() => {
    if (!load) return;
    const controller = new AbortController();
    let url: string | undefined;
    load(controller.signal).then(
      (blob) => {
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setState({ key, value: { status: "ready", url } });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ key, value: { status: "unavailable", message: error instanceof Error ? error.message : "Unavailable." } });
      },
    );
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [load, key]);

  if (!load) return { status: "unavailable", message: "Not requested." };
  return state.key === key ? state.value : { status: "loading" };
};
