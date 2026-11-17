// Names the release APK `SceneSpeak.apk` (instead of `app-release.apk`).
// Debug builds keep `app-debug.apk`: `expo run:android` looks for that exact file when installing.
const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "// @scenespeak/apk-name";

module.exports = function withApkName(config, { name = "SceneSpeak" } = {}) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.contents.includes(MARKER)) return cfg;
    cfg.modResults.contents += `
${MARKER}
android.applicationVariants.all { variant ->
    if (variant.buildType.name == "release") {
        variant.outputs.all { outputFileName = "${name}.apk" }
    }
}
`;
    return cfg;
  });
};
