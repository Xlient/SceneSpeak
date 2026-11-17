import { describe, expect, it } from "vitest";
import { FirebaseConfigError, readFirebaseConfig } from "./config";

const env = {
  VITE_FIREBASE_API_KEY: "test-key",
  VITE_FIREBASE_PROJECT_ID: "scenespeak-test",
  VITE_FIREBASE_APP_ID: "1:123:web:abc",
  VITE_FIREBASE_AUTH_DOMAIN: "scenespeak-test.firebaseapp.com",
};

const invalidKeysOf = (run: () => unknown): readonly string[] => {
  try {
    run();
  } catch (error) {
    if (error instanceof FirebaseConfigError) return error.invalidKeys;
    throw error;
  }
  throw new Error("expected a FirebaseConfigError");
};

describe("readFirebaseConfig", () => {
  it("maps env vars to Firebase options", () => {
    expect(readFirebaseConfig(env).options).toEqual({
      apiKey: "test-key",
      projectId: "scenespeak-test",
      appId: "1:123:web:abc",
      authDomain: "scenespeak-test.firebaseapp.com",
    });
  });

  it("omits blank optional keys", () => {
    expect(readFirebaseConfig({ ...env, VITE_FIREBASE_STORAGE_BUCKET: "  " }).options).not.toHaveProperty("storageBucket");
  });

  it("lists every missing or blank required key", () => {
    expect(invalidKeysOf(() => readFirebaseConfig({ VITE_FIREBASE_API_KEY: " ", VITE_FIREBASE_APP_ID: "x" }))).toEqual([
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_PROJECT_ID",
    ]);
  });

  it("skips App Check without a site key", () => {
    expect(readFirebaseConfig(env, true).appCheck).toBeUndefined();
  });

  it("uses a registered debug token in dev", () => {
    const config = readFirebaseConfig(
      { ...env, VITE_FIREBASE_APPCHECK_SITE_KEY: "site", VITE_FIREBASE_APPCHECK_DEBUG_TOKEN: "token" },
      true,
    );
    expect(config.appCheck).toEqual({ siteKey: "site", debugToken: "token" });
  });

  it("asks the SDK for a new debug token in dev when none is set", () => {
    expect(readFirebaseConfig({ ...env, VITE_FIREBASE_APPCHECK_SITE_KEY: "site" }, true).appCheck?.debugToken).toBe(true);
  });

  it("never uses a debug token in production", () => {
    const config = readFirebaseConfig(
      { ...env, VITE_FIREBASE_APPCHECK_SITE_KEY: "site", VITE_FIREBASE_APPCHECK_DEBUG_TOKEN: "token" },
      false,
    );
    expect(config.appCheck?.debugToken).toBeUndefined();
  });
});
