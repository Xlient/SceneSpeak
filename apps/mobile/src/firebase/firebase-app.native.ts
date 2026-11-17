import AsyncStorage from "@react-native-async-storage/async-storage";
import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { readFirebaseEnv } from "./config";

/**
 * The Firebase app, or null without config. Auth is initialised first with AsyncStorage so the guest
 * survives restarts; later `getAuth()` calls (core's auth client) get this same instance.
 */
export const getFirebaseApp = (): FirebaseApp | null => {
  if (getApps().length > 0) return getApp();
  const env = readFirebaseEnv();
  if (!env) return null;
  const app = initializeApp(env);
  initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  return app;
};
