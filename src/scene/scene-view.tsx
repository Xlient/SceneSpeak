import { useEffect, useRef, useState } from "react";
import type { Animation } from "../schemas";
import { Backdrop } from "./backdrop";
import type { SceneManifest } from "./scene-manifest";
import { type SceneLoadStatus, type ScenePlayer, createScenePlayer } from "./scene-player";

export interface SceneViewProps {
  manifest: SceneManifest;
  animation: Animation;
  /** Present → painted-backdrop mode (gradient until `url` loads). */
  backdrop?: { url?: string | undefined } | undefined;
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const SceneView = ({ manifest, animation, backdrop }: SceneViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<ScenePlayer | null>(null);
  const [status, setStatus] = useState<SceneLoadStatus>("loading");
  const hasBackdrop = backdrop !== undefined;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const player = createScenePlayer({ canvas, reducedMotion: prefersReducedMotion() });
    playerRef.current = player;
    let active = true;
    setStatus("loading");
    void player.load(manifest, { transparentBack: hasBackdrop }).then((result) => {
      if (active) setStatus(result);
    });
    return () => {
      active = false;
      player.dispose();
      playerRef.current = null;
    };
  }, [manifest, hasBackdrop]);

  useEffect(() => {
    playerRef.current?.play(animation);
  }, [animation, status]);

  return (
    <figure className="scene" aria-busy={status === "loading"}>
      {backdrop && <Backdrop url={backdrop.url} gradient={manifest.gradient} />}
      <canvas ref={canvasRef} className="scene-canvas" role="img" aria-label={manifest.description} />
      {status === "loading" && (
        <figcaption className="scene-note" role="status">
          Setting the stage…
        </figcaption>
      )}
    </figure>
  );
};
