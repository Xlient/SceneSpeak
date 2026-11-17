// Build-time additions on top of app.json:
// - Google sign-in's native setup, only when its iOS URL scheme is configured (apps/mobile/.env.local or CI vars),
//   so the app still builds without it.
// - Release version from CI (SCENESPEAK_VERSION_NAME / SCENESPEAK_VERSION_CODE; Play needs a higher code per upload).
// - Release APK name and upload-key signing (plugins/).
module.exports = ({ config }) => {
  const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
  const versionCode = Number(process.env.SCENESPEAK_VERSION_CODE) || config.android?.versionCode || 1;
  return {
    ...config,
    version: process.env.SCENESPEAK_VERSION_NAME || config.version,
    android: { ...config.android, versionCode },
    ios: { ...config.ios, buildNumber: String(versionCode) },
    plugins: [
      ...(config.plugins ?? []),
      ...(iosUrlScheme ? [["@react-native-google-signin/google-signin", { iosUrlScheme }]] : []),
      "./plugins/with-apk-name",
      "./plugins/with-release-signing",
    ],
  };
};
