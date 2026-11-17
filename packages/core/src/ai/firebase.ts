import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { ReCaptchaEnterpriseProvider, initializeAppCheck } from "firebase/app-check";
import { readFirebaseConfig } from "./config";

export const getFirebaseApp = (): FirebaseApp => {
  const existing = getApps()[0];
  if (existing) return existing;

  const { options, appCheck } = readFirebaseConfig(import.meta.env, import.meta.env.DEV);
  const app = initializeApp(options);
  if (appCheck) {
    // The SDK reads this global during initializeAppCheck, so it must be set first.
    if (appCheck.debugToken !== undefined) self.FIREBASE_APPCHECK_DEBUG_TOKEN = appCheck.debugToken;
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheck.siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
  return app;
};
