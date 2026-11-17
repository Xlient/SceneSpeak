import { type BoardStore, unavailableBoard } from "@scenespeak/core/leaderboard/board";
import { createFirestoreBoard } from "@scenespeak/core/leaderboard/firestore-board";
import { createFirestoreLibrary } from "@scenespeak/core/library/firestore-library";
import { type LibraryStore, unavailableLibrary } from "@scenespeak/core/library/library";
import { createModelMonitor, monitored } from "@scenespeak/core/monitor/model-monitor";
import { deviceModel } from "../ai-port/device-model";
import { getFirebaseApp } from "../firebase/firebase-app";
import { createDeviceStatusStore } from "./device-status";
import { createMobileGenerator } from "./mobile-generator";
import { createMobileGrader, toDeviceKind } from "./mobile-grader";
import { createMobileVoiceGrader } from "./mobile-voice-grader";
import { isOnline } from "./network-status";

/** The native on-device model's state; the root layout refreshes it at start. */
export const deviceStatus = createDeviceStatusStore(deviceModel);

const firebaseApp = getFirebaseApp();

/** Firestore library, or the "not connected" stub without Firebase config. */
export const library: LibraryStore = firebaseApp ? createFirestoreLibrary(() => firebaseApp) : unavailableLibrary;

/** Firestore weekly board, or the "not connected" stub without Firebase config. */
export const board: BoardStore = firebaseApp ? createFirestoreBoard(() => firebaseApp) : unavailableBoard;

const deps = { port: deviceModel, deviceKind: () => toDeviceKind(deviceStatus.get()), isOnline };

/** Every AI call, for the Model Monitor (same wrapping as the web app's createAppServices). */
export const monitor = createModelMonitor();

export const appGrader = monitored(monitor, "grade", createMobileGrader(deps), (r) => r.source, "on_device", { routeOf: (r) => r.route });
export const appVoiceGrader = monitored(monitor, "grade-voice", createMobileVoiceGrader(deps), (r) => r.source, "in_cloud", {
  routeOf: (r) => r.route,
});
export const appGenerator = monitored(
  monitor,
  "generate",
  createMobileGenerator({ ...deps, ...(firebaseApp ? { library } : {}) }),
  (r) => (r.kind === "existing" ? "on_device" : "in_cloud"),
  "in_cloud",
);
