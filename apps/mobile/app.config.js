// Build-time additions on top of app.json:
// - Native Firebase config (on-device AI) when google-services.json / GoogleService-Info.plist are present.
//   Both are git-ignored, so the app still builds without them (AI is then off on phones).
// - Google sign-in's native setup, only when its iOS URL scheme is configured (apps/mobile/.env.local or CI vars).
// - Release version from CI (SCENESPEAK_VERSION_NAME / SCENESPEAK_VERSION_CODE; Play needs a higher code per upload).
// - Release APK name, upload-key signing and the test-build App Check debug token (plugins/).
const fs = require("fs");
const path = require("path");

const ifPresent = (file) => (fs.existsSync(path.join(__dirname, file)) ? `./${file}` : undefined);

module.exports = ({ config }) => {
  const googleServices = ifPresent("google-services.json");
  const googleServiceInfo = ifPresent("GoogleService-Info.plist");
  const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
  const versionCode = Number(process.env.SCENESPEAK_VERSION_CODE) || config.android?.versionCode || 1;
  return {
    ...config,
    version: process.env.SCENESPEAK_VERSION_NAME || config.version,
    android: { ...config.android, versionCode, ...(googleServices ? { googleServicesFile: googleServices } : {}) },
    ios: { ...config.ios, buildNumber: String(versionCode), ...(googleServiceInfo ? { googleServicesFile: googleServiceInfo } : {}) },
    plugins: [
      ...(config.plugins ?? []),
      ...(iosUrlScheme ? [["@react-native-google-signin/google-signin", { iosUrlScheme }]] : []),
      "./plugins/with-apk-name",
      "./plugins/with-release-signing",
      "./plugins/with-app-check-debug-token",
      "./plugins/with-firebase-modular-headers",
    ],
  };
};
