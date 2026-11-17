import { addNetworkStateListener, getNetworkStateAsync } from "expo-network";
import { isOnlineFrom } from "./online";

let online = true;

/** Starts tracking connectivity for routing (the offline rule). Returns the cleanup. */
export const startNetworkTracking = (): (() => void) => {
  getNetworkStateAsync()
    .then((state) => {
      online = isOnlineFrom(state);
    })
    .catch(() => undefined);
  const subscription = addNetworkStateListener((state) => {
    online = isOnlineFrom(state);
  });
  return () => subscription.remove();
};

export const isOnline = (): boolean => online;
