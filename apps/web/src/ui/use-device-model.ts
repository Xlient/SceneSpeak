import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useServices } from "./services-context";

export const useDeviceModel = () => {
  const { deviceSetup } = useServices();
  const status = useSyncExternalStore(deviceSetup.status.subscribe, deviceSetup.status.get);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const resume = new AbortController();
    void deviceSetup.resume({ signal: resume.signal });
    return () => {
      resume.abort();
      controller.current?.abort();
    };
  }, [deviceSetup]);

  // Must run straight from the click: Chrome only downloads the model with user activation.
  const setUp = useCallback(() => {
    controller.current?.abort();
    controller.current = new AbortController();
    void deviceSetup.initialize({ signal: controller.current.signal });
  }, [deviceSetup]);

  return { status, setUp };
};
