import { useState } from "react";

export interface BackdropProps {
  url: string | undefined;
  gradient: readonly [string, string];
}

type BackdropStatus = "loading" | "loaded" | "failed";

/** Painted 2D backdrop behind the 3D set. The themed gradient shows while it loads or if it fails. */
export const Backdrop = ({ url, gradient }: BackdropProps) => {
  const [status, setStatus] = useState<{ url: string | undefined; value: BackdropStatus }>({ url, value: "loading" });
  const current: BackdropStatus = status.url === url ? status.value : "loading";

  return (
    <div className="backdrop" style={{ backgroundImage: `linear-gradient(180deg, ${gradient[0]}, ${gradient[1]})` }} aria-hidden="true">
      {url && current !== "failed" && (
        <img
          key={url}
          className={`backdrop-image ${current === "loaded" ? "loaded" : ""}`}
          src={url}
          alt=""
          onLoad={() => setStatus({ url, value: "loaded" })}
          onError={() => setStatus({ url, value: "failed" })}
        />
      )}
    </div>
  );
};
