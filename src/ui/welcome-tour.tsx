import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { DeviceModelStatus } from "../ai/device";
import { MIN_AGE } from "../legal/policy";
import { describeDeviceStep } from "../onboarding/device-step";

export interface WelcomeTourProps {
  device: DeviceModelStatus;
  onSetUpDevice: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onClose: () => void;
}

interface Step {
  icon: string;
  title: string;
  body: ReactNode;
}

export const WelcomeTour = ({ device, onSetUpDevice, onOpenPrivacy, onOpenTerms, onClose }: WelcomeTourProps) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [index, setIndex] = useState(0);
  const deviceStep = describeDeviceStep(device);

  // showModal gives us the focus trap, Escape to close and an inert page behind it.
  // No close() on cleanup: it fires onClose, which would dismiss the tour on React's dev re-mount.
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  const steps: Step[] = [
    {
      icon: "👋",
      title: "Welcome to SceneSpeak",
      body: (
        <p>
          Practise real conversations in tiny 3D scenes. Each lesson takes about 5 minutes: chat with a character, reach your goals, and earn
          stars.
        </p>
      ),
    },
    {
      icon: "💬",
      title: "How a lesson works",
      body: (
        <ol className="tour-list">
          <li>Read or listen to what the character says. Tap 🧩 Grammar to see how a sentence is built.</li>
          <li>Reply by typing, or switch to Speaking mode and use the mic.</li>
          <li>Get instant feedback with a better way to say it, then keep the conversation going.</li>
        </ol>
      ),
    },
    {
      icon: "🔒",
      title: deviceStep.title,
      body: (
        <>
          <p>{deviceStep.body}</p>
          {device.kind === "downloading" && (
            <progress className="tour-progress" value={device.progress} max={1} aria-label="On-device AI download" />
          )}
          {deviceStep.canSetUp && (
            <button type="button" className="small" onClick={onSetUpDevice}>
              Set up on-device AI
            </button>
          )}
          <p className="tour-note">You can do this later from the account menu (your avatar, top right).</p>
        </>
      ),
    },
    {
      icon: "🛡️",
      title: "Your privacy",
      body: (
        <>
          <ul className="tour-list">
            <li>Your progress and streaks are stored only in this browser.</li>
            <li>
              When the cloud is used, your replies, voice clips and lesson requests go to Google's Gemini through Firebase. SceneSpeak doesn't save
              your recordings.
            </li>
            <li>Personal details like emails and phone numbers are removed from lesson requests before they leave your device.</li>
            <li>Joining the leaderboard is optional and shares only your first name and days practised.</li>
          </ul>
          <p className="tour-note">
            SceneSpeak is for ages {MIN_AGE}+; younger learners should use it with a parent or guardian. By continuing you agree to the{" "}
            <button type="button" className="link-button" onClick={onOpenTerms}>
              Terms
            </button>{" "}
            and{" "}
            <button type="button" className="link-button" onClick={onOpenPrivacy}>
              Privacy Policy
            </button>
            .
          </p>
        </>
      ),
    },
  ];

  const step = steps[index];
  if (!step) return null;
  const last = index === steps.length - 1;

  return (
    <dialog ref={dialog} className="tour card" aria-labelledby={titleId} onClose={onClose}>
      <div className="tour-icon" aria-hidden="true">
        {step.icon}
      </div>
      <h2 id={titleId} className="tour-title">
        {step.title}
      </h2>
      <div className="tour-body" aria-live="polite">
        {step.body}
      </div>
      <p className="visually-hidden">
        Step {index + 1} of {steps.length}
      </p>
      <div className="tour-dots" aria-hidden="true">
        {steps.map((s, i) => (
          <span key={s.icon} className={`tour-dot ${i === index ? "active" : ""}`} />
        ))}
      </div>
      <div className="tour-actions">
        {index > 0 ? (
          <button type="button" className="secondary small" onClick={() => setIndex(index - 1)}>
            Back
          </button>
        ) : (
          <button type="button" className="secondary small" onClick={() => dialog.current?.close()}>
            Skip
          </button>
        )}
        <button type="button" className="big" autoFocus onClick={() => (last ? dialog.current?.close() : setIndex(index + 1))}>
          {last ? "Start learning" : "Next"}
        </button>
      </div>
    </dialog>
  );
};
