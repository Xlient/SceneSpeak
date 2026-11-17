import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { readFirebaseEnv } from "./config";

/** The Firebase app, or null without config. Web keeps the SDK's default browser Auth persistence. */
export const getFirebaseApp = (): FirebaseApp | null => {
  if (getApps().length > 0) return getApp();
  const env = readFirebaseEnv();
  return env ? initializeApp(env) : null;
};
