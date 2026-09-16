# MuslimSpaces — Project Architecture & Rules

Helps Muslims in Romania find POIs (mosques, halal restaurants, Islamic learning
centers, doctors/services) on a map.

## Constraint that shapes every infra decision

**Everything runs on Railway. No other paid third-party service** (no Supabase,
no Firebase, no Auth0, no Mapbox-with-billing). If a feature needs a new
dependency, check it's free/self-hostable within Railway before adding it.

## Stack & why

- **Monorepo**: Turborepo + pnpm workspaces.
- **apps/backend**: NestJS, using the **Fastify** HTTP adapter
  (`@nestjs/platform-fastify`) — Nest's modules/guards/pipes are worth it once
  you have auth + RBAC + a moderation workflow; Fastify adapter keeps it fast.
- **apps/web**: Next.js. Chosen specifically for SEO — POI pages
  (`/cluj/mosques`, etc.) must be crawlable, so use SSR/SSG/ISR. **Never**
  make POI listing/detail pages client-only SPA routes.
- **apps/mobile**: Expo (React Native). Talks to the backend's public Railway
  URL — it is not deployed to Railway itself.
- **packages/ui**: custom lightweight design system shared by web + mobile —
  not a third-party UI kit. Design tokens (`tokens.ts`) are plain data with
  no platform split; components are `Name/Name.tsx` (web) +
  `Name/Name.native.tsx` (native) pairs, resolved automatically by each
  bundler (webpack/Turbopack only ever matches the plain `.tsx`; Metro
  prefers `.native.tsx` when present). See "packages/ui architecture" below
  — the peer-dependency pattern there is load-bearing, not incidental.
- **API layer**: typed REST + zod, not tRPC. Reasoning: tRPC is strongest
  when client and server are the same TS project; here one NestJS backend
  serves two very different clients (Next SSR + Expo), so a decoupled,
  OpenAPI-documented REST API is the better fit. Zod schemas live in
  `packages/shared` and validate requests via Nest pipes; the same schemas
  produce the typed client both apps import.
- **Auth**: rolled ourselves (no BaaS auth provider) — `@nestjs/passport` +
  `passport-jwt`, argon2 for password hashing. Do not hand-roll crypto.
  On web, the JWT lives in an httpOnly cookie, so every authenticated write
  from a Client Component goes through a Next.js Route Handler that reads
  the cookie server-side (see "Auth-proxy" pattern in web's `lib/`). Mobile
  has no such constraint — there's no browser/httpOnly boundary — so
  `apps/mobile` stores the JWT directly in `expo-secure-store` and the API
  client attaches it itself; there is no auth-proxy layer on mobile.
- **Database**: Postgres + PostGIS on Railway's Postgres template. Location
  data uses PostGIS `geography(Point, 4326)` columns with GiST spatial
  indexes — required for radius/nearest/bounding-box queries.
- **ORM**: TypeORM, not Prisma. Prisma has no native PostGIS/geography
  column type (would mean raw SQL/`Unsupported` fields for the one column
  that matters most here); TypeORM supports `geometry`/`geography` column
  types directly and has a standard CLI-driven migration workflow
  (`apps/backend/src/database/data-source.ts` + `src/database/migrations/`).
  `synchronize` is always `false` — schema changes go through migrations
  only, since PostGIS indexes need hand-written SQL anyway.
- **File storage**: Railway bucket (S3-compatible object storage), not a
  volume. A volume is pinned to one instance's disk — same problem as the
  ISR cache issue below, but for user data. Buckets are multi-instance-safe.
  Wired via `apps/backend/src/media`: one generic `POST /media` upload
  endpoint (auth required) used by both POI images and blog cover/content
  images — not duplicated per feature. Uploads are never stored as-is:
  `sharp` resizes to two WebP variants (thumbnail ~300px, display ~1200px,
  quality 75-80) and the original is discarded. Keys are content-hashed
  (`media/<sha256>-{thumb,display}.webp`) so re-uploads of the same image
  don't duplicate storage and `Cache-Control: public, max-age=31536000,
  immutable` is always safe. Uses `@aws-sdk/client-s3` with
  `forcePathStyle: true` (works against Railway's bucket, MinIO, and most
  S3-compatible providers — not just AWS's virtual-hosted-style URLs).
- **Maps**: MapLibre GL (fully open-source), not Mapbox — Mapbox needs an
  account + has usage billing, which conflicts with the no-paid-services
  constraint. Web uses `maplibre-gl`; Expo uses
  `@maplibre/maplibre-react-native`, on **11.3.10** (its peer ranges —
  `react>=19.1`, `react-native>=0.80`, `expo>=54` — line up with this
  project's Expo 57/RN 0.86/React 19.2.3 pins; see "packages/ui
  architecture" below). Earlier in this project it was pinned back to
  10.4.2 specifically because 11.x's peer ranges didn't fit the
  then-current Expo 52/RN 0.76/React 18.3.1 pins — that constraint went
  away when the whole stack was bumped for native tab bar support (see
  "apps/mobile architecture"). Note the v10→v11 API rewrite if you ever
  touch `MapView.native.tsx`: `MapView`→`Map`, `PointAnnotation`→`Marker`
  (`coordinate`→`lngLat`, `onSelected`→`onPress`), `Camera`'s
  `defaultSettings`→`initialViewState`, and `onRegionDidChange`'s payload
  is now a flat `event.nativeEvent.bounds` tuple instead of a nested
  GeoJSON feature. This is a **native module** (unlike `maplibre-gl`,
  which is pure JS) — see "apps/mobile architecture" below for what that
  means for local dev.
- **Map tiles**: [OpenFreeMap](https://openfreemap.org) — free, whole-planet
  vector tiles, no API key, explicitly built for production use (not a
  rate-limited courtesy server like `tile.openstreetmap.org`, which its own
  usage policy prohibits building an app on). Chosen over a self-hosted
  PMTiles archive on Railway for simplicity: zero tile infra to generate,
  update, or store ourselves. It's a third-party dependency, but a free one
  with no account/billing, so it doesn't violate the no-paid-services rule.

## Known scaling caveat — flag if touched

Next.js ISR cache lives on **local disk of a single Railway instance**. Fine
at current scale. If anything introduces multiple backend/web instances
(horizontal scaling, Railway replicas), ISR cache will be inconsistent across
instances — this needs an external cache (e.g. moving to on-demand
revalidation with a shared store) before scaling out. Any code that assumes
a single instance (in-memory cache, local file writes outside the DB/bucket)
should get a comment flagging this.

Same class of issue: `@nestjs/throttler`'s default storage (used for the
review-submission rate limit — see Reviews below) is **in-memory per
instance**. Fine on one backend instance; on multiple replicas, each tracks
its own counts independently, so the effective limit becomes "N × replica
count" rather than a true global one. Needs a shared store (e.g. Redis)
before horizontally scaling the backend.

## Data model (see migrations in apps/backend for source of truth)

- **users**: email, hashed password (argon2), role (`user` | `moderator` |
  `admin`), `preferred_locale` (plain string, not an enum — same reasoning
  as `LocalizedText` allowing arbitrary locale keys), timestamps.
- **pois**: name, location (`geography(Point,4326)`), address, phone,
  website, description, name/description in at least `ro` + `en`,
  `rating_avg`/`rating_count` (denormalized from `reviews`, see below),
  status (`pending` | `approved` | `rejected`), submitted_by (→ users),
  timestamps. No `category_id` column and no `opening_hours` string — see
  `poi_categories` and `poi_hours`.
- **categories**: seeded with Jamiah, Mosque, Musallah, Restaurant,
  Convenience Store, Meat Shop, Sweets, Clothing, Doctors, Lawyers, General
  Business — structured so more can be added without a migration (i.e. a
  table, not an enum).
- **poi_categories**: many-to-many join between `pois` and `categories`
  (`poi_id`, `category_id`, `is_primary`), because a POI can genuinely be
  more than one thing (a mosque that's also a Jamiah, a convenience store
  that's also a meat shop). `is_primary` designates the single "headline"
  category for quick-glance labels / map pin icons / SEO category routing
  — enforced via a **partial unique index** (`UNIQUE (poi_id) WHERE
  is_primary`), not a redundant `primary_category_id` column that could
  drift out of sync. A POI must always have ≥1 row here; `PoisService`
  writes the POI row and its category assignments in one transaction.
- **poi_hours**: `poi_id`, `day_of_week` (ISO 1=Monday...7=Sunday, matches
  Postgres's `EXTRACT(ISODOW FROM ...)`), `opens_at`/`closes_at` (`time`).
  Multiple rows per day are allowed (lunch-break-style splits); no rows for
  a day means closed that day. Powers the `openNow` filter on
  `/pois`, `/pois/nearby`, `/pois/bbox` — the query hardcodes
  `Europe/Bucharest` (this app is Romania-only, no per-POI timezone) and
  handles overnight wraparound (`closes_at <= opens_at`, e.g. 20:00-02:00).
  Unlike core POI fields, hours can be edited by the owner **anytime**, not
  just while `pending` — they're operational data (e.g. Ramadan hours), not
  moderated content.
- **poi_images**: `poi_id`, `role` (`logo` | `cover` | `gallery`),
  `storage_key` (bucket base key, variants derived — see File storage
  above), `sort_order`.
- **favorites**: `user_id` + `poi_id` composite PK — a user's saved POIs.
- **reviews**: `poi_id`, `user_id`, `rating` (1-5), `comment` (optional),
  `status` (`published` | `hidden`). `UNIQUE (poi_id, user_id)` — one
  review per user per POI; resubmitting **edits** the existing row rather
  than creating a duplicate. See Reviews below for the moderation model.
  `pois.rating_avg`/`rating_count` are recomputed in the same transaction
  as every review write (create/edit/hide/delete) so reads never need an
  aggregate join.
- **blog_posts**: `slug`, localized `title`/`excerpt` (jsonb, `ro`+`en`
  minimum, same rule as POIs), `content` (markdown text per locale — no
  block-based content model; content images are plain
  `![alt](bucket-url)` references, not a separate content-image table),
  `cover_image_key` (optional, bucket base key), `author_id` (→ users),
  `status` (`draft` | `published`), `published_at`, timestamps.
- **cities**: optional, for SEO-friendly URLs like `/cluj/mosques`.

## Reviews: open + rate-limited, not pre-moderated

Deliberately different from the POI moderation workflow. Reviews publish
**immediately** on submission — no `pending` queue. Abuse is guarded by
rate limiting instead: **10 submissions/hour per authenticated user**
(`@nestjs/throttler`, tracked by user id via a custom `getTracker` override
in `UserThrottlerGuard` — not by IP, since submitting already requires
auth). `status: hidden` is a moderator **takedown after the fact**, not a
publish gate — and editing a review never resets `hidden` back to
`published`, so a user can't use "edit" to undo a moderator's decision.
"My reviews" (`GET /reviews/mine`) shows a user's own reviews regardless of
status, since it's their own content.

## Moderation workflow

POIs submitted by regular users start `pending`. Only `moderator`/`admin`
roles can transition to `approved`/`rejected`. Public POI list/detail
endpoints (and the SSR pages that read them) only ever return `approved`
POIs.

## Railway deployment shape

One Railway project, multiple services:
- `web` — root directory `apps/web`, build via `turbo run build --filter=web`.
- `backend` — root directory `apps/backend`.
- `postgres` — Railway Postgres template, PostGIS extension enabled.
- bucket — Railway object storage for POI photos.

Mobile is **not** a Railway service — it ships via Expo/app stores and just
needs the backend's public URL as its API base.

Root directory / build command settings live in each Railway service's
config, not in a root-level Railway config file, since this is a monorepo.

**Build mechanics**: `web` and `backend` each have a `Dockerfile` in their
app directory (`apps/backend/Dockerfile`, `apps/web/Dockerfile`).
On Railway, set each service's **build context / root directory to the repo
root** and point "Dockerfile Path" at the app-specific Dockerfile — pnpm
workspaces need the whole monorepo (root `package.json`,
`pnpm-workspace.yaml`, `packages/*`) present at install time to resolve
`workspace:*` deps like `@muslimspaces/shared`. Pointing root directory at
`apps/backend` directly would hide the workspace root from `pnpm install`
and break the build.

## Practices

- `packages/shared` is a **compiled** package (`tsc` → `dist/`, CommonJS),
  not a raw-TS-source internal package — the backend's build output runs via
  plain `node dist/main.js`, which cannot `require()` `.ts` files directly.
  After changing anything in `packages/shared`, run
  `pnpm --filter=@muslimspaces/shared build` (or just `pnpm build` /
  `pnpm dev` from the repo root, which goes through turbo and resolves the
  dependency order automatically) before the backend will pick it up.
- Zod schemas in `packages/shared` are the single source of truth for
  request/response shapes — don't duplicate validation logic in the
  backend controllers beyond wiring the pipe.
- Keep `packages/ui` limited to what's genuinely shareable between RN and
  web (design tokens, primitives) — don't force web-only or RN-only
  components in there.
- Public-facing POI content needs `ro` + `en` at minimum; don't add a field
  that only supports one language.
- `apps/mobile` needs Node **>=20.19.4** to run the Expo CLI (`expo start`,
  `expo export`, etc.) — plain `tsc`/`pnpm install` work fine on older Node,
  but the CLI itself refuses to start below that version. Use `nvm use` (or
  `nvm exec <version> npx expo ...`) if your default Node is older. Caveat:
  `nvm exec <version> npx expo install ...` can fail with `spawn pnpm ENOENT`
  if pnpm itself isn't installed under that nvm'd Node version — in that case
  run the underlying `pnpm add <packages>` command directly (under the
  default Node) using the exact versions the failed `expo install` command
  printed, rather than fighting nvm's PATH.
- If Metro fails to resolve `@babel/runtime/helpers/...`: pnpm's strict
  linking doesn't hoist transitive deps the way npm/yarn's flat
  `node_modules` does, and Metro (unlike Node's `require`) expects
  `@babel/runtime` to just be there. It's listed as a direct dependency in
  `apps/mobile/package.json` for this reason — don't remove it as
  "unused," and add any other RN package that hits the same resolution
  error as a direct dependency rather than fighting pnpm's hoisting.
- Local dev needs an S3-compatible target for the media/bucket pipeline —
  use MinIO (`quay.io/minio/minio`, **not** `minio/minio` on Docker Hub,
  which is deprecated/pull-denied). After starting it, create the bucket
  and set public-read access with the `mc` client
  (`quay.io/minio/mc`, entrypoint override needed: `docker run --rm
  --network host --entrypoint sh quay.io/minio/mc -c "mc alias set ..."`)
  — see `apps/backend/.env.example` for the matching `S3_*` vars.
- A raw `QueryFailedError` (e.g. a malformed UUID in a route param) is
  caught globally by `QueryFailedFilter` (`apps/backend/src/common/filters`)
  and mapped to a clean 4xx instead of leaking a Postgres error as a 500.
  `PoisService`/`FavoritesService` still catch FK violations themselves
  first (for a more specific message) — the filter is the fallback for
  everything else.
- `apps/mobile/ios/` and `apps/mobile/android/` are gitignored — this
  project uses Expo's Continuous Native Generation (CNG), so those
  directories are regenerated from `app.json` + installed config plugins
  by `expo prebuild` (which `expo run:ios`/`expo run:android` invoke
  automatically). Never hand-edit files inside them; a change that needs
  to survive a fresh prebuild belongs in `app.json` or a config plugin.
- Pin exact versions (no `^` range) for `react`/`react-dom`/`@types/react`/
  `@types/react-dom` in `apps/web`. A floating range can drift to a patch
  whose types conflict with Next's generated `LayoutProps`/`PageProps`
  helpers (this bit us once with React 19 — a real, documented
  Next↔React-types incompatibility, not a monorepo/pnpm hoisting issue).
  Relatedly, type layout/page `children` props as the ambient
  `React.ReactNode` (no explicit `import type { ReactNode } from "react"`)
  — matches Next's own default template and avoids the same class of
  mismatch.

### `packages/ui` architecture — read before touching any component here

**`apps/web` and `apps/mobile` are deliberately pinned to the exact same
`react` (19.2.3), `react-native` (0.86.3), `lucide-react`/`lucide-react-native`
(1.46.0) versions.** This is load-bearing, not a coincidence — do not bump
one app's React version without bumping the other the same way. (Bumped
together from 18.3.1/0.76.9/0.468.0 when the mobile app moved to Expo SDK 57
for native tab bar support — see "apps/mobile architecture" — re-verified with
the same `readlink -f` single-instance check described below.) Reason:

- `packages/ui` ships raw `.tsx`/`.native.tsx` source, consumed directly by
  each app's own bundler (`transpilePackages: ["@muslimspaces/ui"]` in
  `apps/web/next.config.mjs`; Metro transforms workspace-package source by
  default, no config needed). It declares `react`, `react-native`,
  `lucide-react`, `lucide-react-native` as **peerDependencies only** —
  never real `dependencies` — so it never ships its own copy that could
  end up loaded alongside each app's own copy (two React instances in one
  app = broken hooks / crashes).
- pnpm's default `auto-install-peers` defeats this anyway: it
  unconditionally links a resolved peer into the *declaring* package's own
  `node_modules`, ignoring which real consumer needs what. In practice this
  once produced a `react-native` build linked against React 19 sitting
  inside `packages/ui/node_modules`, while `apps/mobile` itself correctly
  used React 18 — a real dual-instance bug, not theoretical. Fixed two ways
  together: root `.npmrc` sets `auto-install-peers=false`, **and** every
  app in the workspace uses identical versions for these packages, so even
  `packages/ui`'s own (dev-only, for local editor/type support) matching
  devDependencies resolve to the exact same pnpm store entry as each app's
  copy — one physical instance, not an ambiguous choice between two.
- TypeScript's module resolution for a file resolves relative to that
  file's own **real, symlink-resolved path** (unlike webpack/Metro, which
  resolve relative to the symlink's apparent path). This means a bare
  `import "react"` inside `packages/ui/src/*.tsx` needs `react` reachable
  from `packages/ui`'s own directory for typecheck/build-time type-checking
  to succeed — hence the matching devDependencies there, safe only because
  of the version-alignment rule above.
- `apps/mobile/tsconfig.json` sets `"moduleSuffixes": [".native", ""]` —
  without it, plain `tsc` (used by `pnpm typecheck`) resolves `./Button`
  the same way webpack would (always the plain `.tsx`), silently
  type-checking the *web* variant of every shared component instead of the
  one Metro actually bundles.
- `apps/mobile/metro.config.js` sets `watchFolders`/`resolver.nodeModulesPaths`
  to include the monorepo root — Metro's default watch scope is just the
  app's own directory, so without this it can't see `packages/ui` or
  `packages/shared` at all.
- Any `packages/ui` component using a hook (`useState`/`useEffect`/etc.) or
  wiring a DOM event handler (`onClick`/`onChange`) needs `"use client"` at
  the top of its **web** `.tsx` file specifically (not `.native.tsx`, which
  has no such concept). Next's RSC compiler flags this at build time if
  it's missing, since `apps/web/src/app/page.tsx` and friends are Server
  Components by default.

### `apps/mobile` architecture

- **Routing**: Expo Router (file-based, `app/` directory), not React
  Navigation configured by hand — keeps routing philosophy consistent with
  Next's App Router on web. `(tabs)/` holds the three bottom tabs (Explore,
  Favorites, Profile); `pois/[id]`, `blog/index`, `blog/[slug]`, `about`,
  `login`, `signup` are pushed/modal screens outside the tab group, declared
  explicitly in the root `app/_layout.tsx`'s `<Stack>` (Expo Router doesn't
  require this, but explicit `<Stack.Screen>` entries make header
  options — title, modal presentation — easy to see in one place rather
  than scattered per-screen). `main` in `package.json` is
  `"expo-router/entry"`, replacing the old bare `App.tsx`/`index.ts` pair.
- **Bottom tab bar**: `app/(tabs)/_layout.tsx` uses `NativeTabs`/
  `NativeTabs.Trigger` from `expo-router/unstable-native-tabs` — a *real*
  native tab bar (`UITabBarController` on iOS, Material bottom nav on
  Android), not a JS-rendered React Navigation bar. This is what gets iOS
  26's Liquid Glass automatically, with zero custom styling code — the OS
  draws it. Deliberately chosen over a hand-rolled blur-view approximation
  bolted onto React Navigation's bottom-tabs. Two real consequences:
  - The import path is still `unstable-native-tabs` even on the latest
    stable Expo SDK (57) — Expo has not stabilized this API. Treat it as a
    genuine preview API that may need updating on a future SDK bump, not a
    typo.
  - Icons can't be arbitrary React components (unlike the rest of the app,
    which uses `lucide-react-native` everywhere else) — `NativeTabs.Trigger.Icon`
    takes an SF Symbol name (`sf`, iOS) and a Material Symbol name (`md`,
    Android), both **strict literal-union types** validated against each
    platform's real icon catalog (`sf-symbols-typescript`, `expo-symbols`) —
    a typo is a type error, not a runtime blank icon. Tab config (route
    name, label, `sf`/`md` icon names) lives in
    `src/navigation/tabs.ts` as a small typed array so `_layout.tsx` just
    maps over it, rather than repeating the same JSX shape three times.
    This isn't a `packages/ui` component — `NativeTabs`' compound API has
    no web equivalent (same reasoning that keeps `Navbar` in `apps/web`
    only, not shared).
- **`apps/mobile/tsconfig.json` also needs `"moduleResolution": "bundler"`**
  (overriding `expo/tsconfig.base`'s default `"node"`) — plain `"node"`
  resolution predates package.json `exports` subpaths and can't resolve
  `@muslimspaces/ui/map`, even though Metro itself (bundler resolution)
  handles it fine at runtime. Keep this alongside the existing
  `moduleSuffixes` override, not instead of it — they solve different
  problems.
- **`@maplibre/maplibre-react-native` is a native module**, unlike
  `maplibre-gl` on web — it requires compiled native code, so it **cannot
  run inside plain Expo Go**. Local dev needs a custom dev client
  (`expo-dev-client`, already a dependency) built via `npx expo run:ios` /
  `npx expo run:android` (or an EAS dev-client build) at least once, and
  after that `pnpm dev` (`expo start`) reconnects to the same dev client
  for fast-refresh iteration. `app.json` lists
  `"@maplibre/maplibre-react-native"` in `plugins` so `expo prebuild` wires
  its native config automatically.
- **Auth token storage**: `expo-secure-store`, not AsyncStorage — the JWT
  is sensitive enough to warrant the Keychain/Keystore-backed API rather
  than plain unencrypted storage. `src/lib/api-client.ts` wraps
  `createApiClient` with a `getToken` that reads SecureStore directly;
  `src/auth/AuthContext.tsx` is the single source of truth for the current
  user across all screens (login/signup/logout mutate it, `useAuth()` reads
  it) — don't call `SecureStore` directly from screen components.
- **Media uploads from mobile** (avatar photo) pass a
  `{ uri, name, type }` object (from `expo-image-picker`) to
  `packages/shared`'s `media.upload(file: Blob, filename)`, cast through
  `as unknown as Blob` — React Native's `FormData.append` accepts that
  object shape as a file part at runtime (it has no real `Blob`/DOM
  environment), even though it doesn't structurally satisfy TypeScript's
  DOM `Blob` interface. This is the standard RN pattern for file uploads,
  not a hack specific to this codebase.
- **Expo SDK 57 / React Native 0.86 / New Architecture is mandatory** —
  RN 0.82 removed the legacy bridge entirely, so every native module in the
  dependency tree must be New-Architecture-compatible; there is no
  `newArchEnabled: false` opt-out anymore. This is also *why* React bumped
  to 19.2.3 (RN 0.86.3's own `react` peer requirement is `^19.2.3` exactly,
  not a preference).
- **`react-native-reanimated` and `react-native-worklets`** were originally
  added as transitive peer dependencies of `expo-router` 57 (pulled in by an
  internal drawer-navigator dependency, not anything this app used at the
  time) and of `expo-modules-core` respectively — `pnpm install` will flag
  the missing peers again if you remove them. `react-native-reanimated` is
  now also a *direct* dependency in practice: `@gorhom/bottom-sheet` (the
  Explore tab's draggable POI sheet) is built on it.
- **`react-native-screens` is pinned to a nightly build**
  (`4.29.0-nightly-20260915-8b2163ba5`), not a tagged release — temporarily,
  and deliberately, not an oversight. `expo-router`'s `NativeTabs` renders
  through `react-native-screens`' native tab host, which has a real bug:
  `setTabBarHidden:animated:` was hardcoded to `NO`
  ([react-native-screens#4627](https://github.com/software-mansion/react-native-screens/issues/4627)),
  so toggling `NativeTabs`' `hidden` prop (see "Bottom tab bar" above) could
  only ever snap instantly, never slide. The fix
  ([#4632](https://github.com/software-mansion/react-native-screens/pull/4632),
  merged 2026-09-14, adds `ios.tabBarHiddenAnimationEnabled`, default
  `true`) isn't in a stable release yet — confirmed absent from `4.28.0`,
  confirmed present in the `4.29.0-nightly-20260915` build pinned here.
  **Swap this pin for the first stable 4.x release that includes the fix**
  (the PR is labeled `action:backport-to-v4`) and drop this note once done.
