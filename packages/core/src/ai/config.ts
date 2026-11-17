import type { FirebaseOptions } from "firebase/app";
import { z } from "zod";

const blankToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;
const required = z.preprocess(blankToUndefined, z.string().trim().min(1));
const optional = z.preprocess(blankToUndefined, z.string().trim().min(1).optional());

const FirebaseEnv = z.object({
  VITE_FIREBASE_API_KEY: required,
  VITE_FIREBASE_PROJECT_ID: required,
  VITE_FIREBASE_APP_ID: required,
  VITE_FIREBASE_AUTH_DOMAIN: optional,
  VITE_FIREBASE_STORAGE_BUCKET: optional,
  VITE_FIREBASE_MESSAGING_SENDER_ID: optional,
  VITE_FIREBASE_APPCHECK_SITE_KEY: optional,
  VITE_FIREBASE_APPCHECK_DEBUG_TOKEN: optional,
});

export class FirebaseConfigError extends Error {
  override readonly name = "FirebaseConfigError";
  readonly invalidKeys: readonly string[];

  constructor(invalidKeys: readonly string[]) {
    super(
      `Firebase config is missing or invalid: ${invalidKeys.join(", ")}. ` +
        "Copy .env.example to .env.local and fill in your Firebase web app config.",
    );
    this.invalidKeys = invalidKeys;
  }
}

export interface AppCheckConfig {
  siteKey: string;
  debugToken: string | true | undefined;
}

export interface FirebaseConfig {
  options: FirebaseOptions;
  appCheck: AppCheckConfig | undefined;
}

export const readFirebaseConfig = (env: Readonly<Record<string, unknown>>, isDev = false): FirebaseConfig => {
  const parsed = FirebaseEnv.safeParse(env);
  if (!parsed.success) {
    throw new FirebaseConfigError([...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))]);
  }
  const e = parsed.data;
  const options: FirebaseOptions = {
    apiKey: e.VITE_FIREBASE_API_KEY,
    projectId: e.VITE_FIREBASE_PROJECT_ID,
    appId: e.VITE_FIREBASE_APP_ID,
  };
  if (e.VITE_FIREBASE_AUTH_DOMAIN) options.authDomain = e.VITE_FIREBASE_AUTH_DOMAIN;
  if (e.VITE_FIREBASE_STORAGE_BUCKET) options.storageBucket = e.VITE_FIREBASE_STORAGE_BUCKET;
  if (e.VITE_FIREBASE_MESSAGING_SENDER_ID) options.messagingSenderId = e.VITE_FIREBASE_MESSAGING_SENDER_ID;

  // In dev without a registered token, `true` makes the SDK print a fresh debug token to the console.
  const debugToken: string | true | undefined = isDev ? (e.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN ?? true) : undefined;
  const appCheck = e.VITE_FIREBASE_APPCHECK_SITE_KEY
    ? { siteKey: e.VITE_FIREBASE_APPCHECK_SITE_KEY, debugToken }
    : undefined;
  return { options, appCheck };
};
