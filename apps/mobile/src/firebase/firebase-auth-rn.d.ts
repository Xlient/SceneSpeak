// firebase/auth re-exports @firebase/auth, which Metro resolves to its React Native build at runtime,
// but the wrapper's types are the browser ones. This adds the one RN-only export we use.
import type { Persistence, ReactNativeAsyncStorage } from "firebase/auth";

declare module "firebase/auth" {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
