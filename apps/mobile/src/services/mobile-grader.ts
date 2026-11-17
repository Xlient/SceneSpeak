import type { DeviceModelStatus } from "@scenespeak/core/ai/device";
import { createModelGrader } from "@scenespeak/core/ai/model-grader";
import type { Grader } from "@scenespeak/core/lesson/grader";
import { routeAiCall } from "@scenespeak/core/routing/route";
import type { DeviceModelInfo, HybridModel } from "../ai-port/hybrid-model";
import { createPortModels } from "./port-models";

const DEVICE_KIND: Readonly<Record<DeviceModelInfo["status"], DeviceModelStatus["kind"]>> = {
  available: "ready",
  downloading: "downloading",
  downloadable: "idle",
  unavailable: "unavailable",
};

export const toDeviceKind = (info: DeviceModelInfo): DeviceModelStatus["kind"] => DEVICE_KIND[info.status];

export interface MobileAiDeps {
  port: HybridModel;
  deviceKind: () => DeviceModelStatus["kind"];
  isOnline: () => boolean;
}

/** Same pipeline as the web's live grader (routing → quick grade → model → parse), over the native port. */
export const createMobileGrader = ({ port, deviceKind, isOnline }: MobileAiDeps): Grader => {
  const model = createPortModels(port);
  return (request) => {
    const route = routeAiCall({
      task: "grade",
      device: deviceKind(),
      language: request.scenario.language,
      online: isOnline(),
      inputChars: request.reply.length,
    });
    return createModelGrader(model("grade", route.mode))(request).then((result) => ({ ...result, route: route.reason }));
  };
};
