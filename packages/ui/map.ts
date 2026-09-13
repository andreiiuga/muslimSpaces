// A literal top-level file, not just a package.json "exports" entry —
// Metro (as shipped with this Expo SDK) doesn't resolve package.json
// "exports" subpaths at all, so "@muslimspaces/ui/map" needs a real file
// at this path for Metro's classic resolution to find. Webpack/Turbopack
// (web) also resolve it here via the "exports" map in package.json, so
// both bundlers land on the same file. The relative import below still
// goes through each bundler's normal .native.tsx/.tsx platform resolution.
export * from "./src/MapView";
