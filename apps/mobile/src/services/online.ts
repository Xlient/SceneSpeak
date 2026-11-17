export interface NetworkSnapshot {
  isConnected?: boolean | undefined;
  isInternetReachable?: boolean | undefined;
}

/** Offline only when the OS says so; unknown counts as online so a slow check never blocks the cloud. */
export const isOnlineFrom = (state: NetworkSnapshot): boolean => state.isConnected !== false && state.isInternetReachable !== false;
