import { useEffect, useId, useRef, useState } from "react";
import { describeAccount } from "../auth/auth-state";
import { Avatar } from "./avatar";
import type { DeviceStatusView } from "./device-status";
import type { AuthSession } from "./use-auth";

export interface AccountMenuProps {
  auth: AuthSession;
  device: DeviceStatusView;
  onDeviceSetUp: () => void;
  streak: number;
  lessonsDone: number;
  monitorOpen: boolean;
  onToggleMonitor: () => void;
}

export const AccountMenu = ({ auth, device, onDeviceSetUp, streak, lessonsDone, monitorOpen, onToggleMonitor }: AccountMenuProps) => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const view = describeAccount(auth.status);
  const name = auth.enabled ? view.label : "You";

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={root}>
      <button
        ref={button}
        type="button"
        className="avatar-button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar status={auth.status} />
        <span className={`avatar-dot ${device.tone}`} aria-hidden="true" />
        <span className="visually-hidden">Account and settings for {name}</span>
      </button>

      {open && (
        <div id={panelId} className="menu-panel card">
          <div className="menu-profile">
            <Avatar status={auth.status} size="large" />
            <div>
              <p className="menu-name">{name}</p>
              <p className="menu-sub">
                {streak > 0 ? `🔥 ${streak}-day streak` : "🌱 No streak yet"} · {lessonsDone} {lessonsDone === 1 ? "lesson" : "lessons"}
              </p>
            </div>
          </div>

          <div className="menu-row" title={device.detail}>
            <span className={`dot ${device.tone}`} aria-hidden="true" />
            <span className="menu-row-label">{device.label}</span>
            {device.progress !== undefined && <progress className="pill-progress" value={device.progress} max={1} aria-label="Model download" />}
            {device.action && (
              <button type="button" className="small" onClick={onDeviceSetUp}>
                {device.action}
              </button>
            )}
          </div>

          <button type="button" className="menu-item" aria-pressed={monitorOpen} onClick={onToggleMonitor}>
            📊 {monitorOpen ? "Hide" : "Show"} Model Monitor
          </button>

          {auth.enabled && view.action && (
            <button
              type="button"
              className={`menu-item ${view.action.kind === "google" ? "primary" : ""}`}
              disabled={auth.busy}
              onClick={view.action.kind === "google" ? auth.signInWithGoogle : auth.signOut}
            >
              {view.action.kind === "google" ? "Sign in with Google to save progress" : "Sign out"}
            </button>
          )}
          <p className="account-error" role="status" aria-live="polite">
            {auth.error}
          </p>
        </div>
      )}
    </div>
  );
};
