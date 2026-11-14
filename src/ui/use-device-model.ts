import { useCallback, useEffect, useRef, useState } from "react";
import type { DeviceModelStatus } from "../ai/device";
import { useServices } from "./services-context";

export const useDeviceModel = () => {
  const { deviceSetup } = useServices();
  const [status, setStatus] = useState<DeviceModelStatus>(() =>
    deviceSetup.isSupported() ? { kind: "idle" } : { kind: "not-supported" },
  );
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  // Must run straight from the click: Chrome only downloads the model with user activation.
  const setUp = useCallback(() => {
    controller.current?.abort();
    controller.current = new AbortController();
    void deviceSetup.initialize(setStatus, { signal: controller.current.signal });
  }, [deviceSetup]);

  return { status, setUp };
};
