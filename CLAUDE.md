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
- **API layer**: typed REST + zod, not tRPC. Reasoning: tRPC is strongest
  when client and server are the same TS project; here one NestJS backend
  serves two very different clients (Next SSR + Expo), so a decoupled,
  OpenAPI-documented REST API is the better fit. Zod schemas live in
  `packages/shared` and validate requests via Nest pipes; the same schemas
  produce the typed client both apps import.
- **Auth**: rolled ourselves (no BaaS auth provider) — `@nestjs/passport` +
  `passport-jwt`, argon2 for password hashing. Do not hand-roll crypto.
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
- **Maps**: MapLibre GL (fully open-source), not Mapbox — Mapbox needs an
  account + has usage billing, which conflicts with the no-paid-services
  constraint. Web uses `maplibre-gl`; Expo uses
  `@maplibre/maplibre-react-native`.
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

## Data model (initial pass — see migrations in apps/backend for source of truth)

- **users**: email, hashed password (argon2), role (`user` | `moderator` |
  `admin`), timestamps.
- **pois**: name, category_id, location (`geography(Point,4326)`), address,
  phone, website, opening_hours, description, name/description in at least
  `ro` + `en`, status (`pending` | `approved` | `rejected`), submitted_by
  (→ users), timestamps.
- **categories**: seeded with mosque, halal_restaurant, islamic_school,
  healthcare, other — structured so more can be added without a migration
  (i.e. a table, not an enum).
- **cities**: optional, for SEO-friendly URLs like `/cluj/mosques`.

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
  `nvm exec <version> npx expo ...`) if your default Node is older.
- If Metro fails to resolve `@babel/runtime/helpers/...`: pnpm's strict
  linking doesn't hoist transitive deps the way npm/yarn's flat
  `node_modules` does, and Metro (unlike Node's `require`) expects
  `@babel/runtime` to just be there. It's listed as a direct dependency in
  `apps/mobile/package.json` for this reason — don't remove it as
  "unused," and add any other RN package that hits the same resolution
  error as a direct dependency rather than fighting pnpm's hoisting.
