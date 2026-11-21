// Bakes an App Check debug token into test builds (sideloaded APKs and simulator builds can't attest).
// The token comes from SCENESPEAK_APPCHECK_DEBUG_TOKEN at prebuild time and is never committed; register it
// for both apps in the Firebase console and revoke it when the test period ends. modules/hybrid-ai reads it.
const { AndroidConfig, withAndroidManifest, withInfoPlist } = require("expo/config-plugins");

const ANDROID_KEY = "dev.scenespeak.APP_CHECK_DEBUG_TOKEN";
const IOS_KEY = "SceneSpeakAppCheckDebugToken";

module.exports = function withAppCheckDebugToken(config) {
  const token = process.env.SCENESPEAK_APPCHECK_DEBUG_TOKEN?.trim();
  if (!token) return config;

  config = withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(app, ANDROID_KEY, token);
    return cfg;
  });

  return withInfoPlist(config, (cfg) => {
    cfg.modResults[IOS_KEY] = token;
    return cfg;
  });
};
