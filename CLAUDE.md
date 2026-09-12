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
  `nvm exec <version> npx expo ...`) if your default Node is older.
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
- Next.js 15 + React 19: pin exact versions (no `^` range) for
  `react`/`react-dom`/`@types/react`/`@types/react-dom` in `apps/web`. A
  floating range can drift to a React 19 patch whose types conflict with
  Next's generated `LayoutProps`/`PageProps` helpers (a real, documented
  Next↔React-19-types incompatibility, not a monorepo/pnpm hoisting issue).
  Relatedly, type layout/page `children` props as the ambient
  `React.ReactNode` (no explicit `import type { ReactNode } from "react"`)
  — matches Next's own default template and avoids the same class of
  mismatch.
