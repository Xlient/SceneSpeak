// modules/hybrid-ai links Firebase's Swift pods as static libraries, which can only import the Objective-C
// pods they depend on when those generate module maps. Opt in just these, not use_modular_headers! globally.
const { withPodfile } = require("expo/config-plugins");

const MARKER = "# @scenespeak/firebase-modular-headers";
const PODS = ["FirebaseCore", "FirebaseCoreExtension", "FirebaseCoreInternal", "FirebaseAppCheckInterop", "FirebaseAuthInterop", "GoogleUtilities"];

module.exports = function withFirebaseModularHeaders(config) {
  return withPodfile(config, (cfg) => {
    const podfile = cfg.modResults.contents;
    if (podfile.includes(MARKER)) return cfg;
    const lines = [MARKER, ...PODS.map((pod) => `  pod '${pod}', :modular_headers => true`)].join("\n");
    cfg.modResults.contents = podfile.replace(/^(\s*use_expo_modules!.*)$/m, `$1\n${lines}`);
    if (!cfg.modResults.contents.includes(MARKER)) throw new Error("with-firebase-modular-headers: use_expo_modules! not found in Podfile");
    return cfg;
  });
};
