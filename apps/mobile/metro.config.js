// Expo detects the pnpm workspace on its own.
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("glb", "gltf", "bin");

// R3F native require()s three, which would pick three's CJS build: that build calls
// process.emitWarning (missing in React Native) and would be a second copy next to the ESM one.
const THREE_ESM = path.join(path.dirname(require.resolve("three")), "three.module.js");
config.resolver.resolveRequest = (context, moduleName, platform) =>
  moduleName === "three"
    ? { type: "sourceFile", filePath: THREE_ESM }
    : context.resolveRequest(context, moduleName, platform);

module.exports = config;
