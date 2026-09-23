const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// pnpm workspace packages (e.g. @muslimspaces/ui, @muslimspaces/shared) live
// outside apps/mobile — Metro's default watch scope is just the app
// directory, so without this it won't see them at all.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Wraps (not replaces) the config above — withNativeWind only adds a CSS
// entry point + a transformer hook, it doesn't touch watchFolders/
// nodeModulesPaths.
module.exports = withNativeWind(config, { input: "./global.css" });
