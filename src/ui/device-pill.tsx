import { describeDeviceStatus } from "./device-status";
import { useDeviceModel } from "./use-device-model";

export const DevicePill = () => {
  const { status, setUp } = useDeviceModel();
  const view = describeDeviceStatus(status);

  return (
    <>
      <span className="pill" role="status" aria-live="polite" title={view.detail}>
        <span className={`dot ${view.tone}`} aria-hidden="true" />
        {view.label}
        {view.progress !== undefined && (
          <progress className="pill-progress" value={view.progress} max={1} aria-label="Model download" />
        )}
      </span>
      {view.action && (
        <button type="button" className="small" onClick={setUp}>
          {view.action}
        </button>
      )}
    </>
  );
};
