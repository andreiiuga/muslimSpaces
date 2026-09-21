# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Muslims living in Romania, nationwide — the historic Turkish-Tatar Muslim
community in Dobrogea (Constanța/Tulcea, where most mosques in the seeded
data are concentrated), plus more recent immigrants, international students,
expats, and converts in cities across the country (Bucharest, Cluj-Napoca,
Timișoara, Iași, etc.). Two secondary roles use the same web app: community
members who submit new POIs, leave reviews, and favorite places; and
moderators/admins who approve submissions, manage the category/city
taxonomy, moderate reviews, and write blog content.

## Product Purpose

Helps Muslims in Romania find community-relevant places on a map: mosques,
halal restaurants, Islamic learning centers (Jamiah), musallahs, meat shops,
and Muslim-run/relevant services (doctors, lawyers, general businesses).
Success is someone finding a real, currently-open, moderated place near them
that a generic map wouldn't surface or categorize correctly.

## Positioning

Not a scrape of Google Maps results — a community-curated, moderated
directory specific to Romania's Muslim community. Listings go through a
moderation workflow (pending → approved/rejected) before appearing publicly;
reviews publish immediately but are rate-limited and subject to moderator
takedown, not pre-moderation. Bilingual by default (Romanian + English) for
every public-facing listing.

## Operating Context

Visitors browse the map/list unauthenticated. Logged-in users can favorite
places, leave one review per place (editable, not resettable to "published"
by the user once a moderator hides it), and submit new POIs (auto-approved
if the submitter is a moderator/admin, otherwise queued for review).
Moderators/admins work from a dedicated `/admin` section: approve/reject/
hide/delete POIs, manage images (add/reorder/delete, cover + gallery roles),
manage categories and cities (admin-only), moderate reviews, and write/
publish blog posts. The "Open now" filter and per-day hours matter — many
listed places (mosques especially) have specific prayer-time-driven or
irregular hours.

## Capabilities and Constraints

- SSR for SEO: POI listing/detail pages must stay crawlable (never
  client-only SPA routes) since discoverability (e.g. "mosque near me in
  Cluj") is core to the product's purpose.
- No paid third-party services — MapLibre GL + OpenFreeMap tiles (not
  Mapbox), Railway-hosted Postgres/PostGIS, Railway object storage.
- Auth is cookie-based (httpOnly) on web; every authenticated write from a
  Client Component proxies through a Next.js Route Handler.
- Categories are a managed taxonomy (admin-editable), not a fixed enum:
  Mosque, Jamiah, Musallah, Restaurant, Convenience Store, Meat Shop,
  Sweets, Clothing, Doctors, Lawyers, General Business.
- POI names/descriptions require Romanian + English at minimum; Arabic is
  not yet supported on web (mobile has an EN/RO/AR switch, web doesn't).
- Currently ~110 public POIs (127 seeded, some intentionally hidden),
  concentrated in Dobrogea with nationwide coverage.

## Brand Commitments

- Name: **MuslimSpaces**. Romanian tagline used on the Explore page:
  "Locurile ținute de comunitate" ("The places the community keeps").
  Signature line "Proiect comunitar · București · hello@muslimspaces.ro" —
  there is no site-wide footer; it lives at the bottom of the About page
  instead, so every viewport (mobile Explore especially) stays a static,
  non-scrolling screen rather than always carrying a footer's worth of
  extra height.
- No dedicated logo file yet — the navbar currently pairs a generic map-book
  icon (lucide `Map`-family icon) with the wordmark, not a custom mark.
- Primary color is a teal/green (`colors.primary` in the shared design
  tokens), warm off-white backgrounds; established for both web and mobile.

## Evidence on Hand

- Real production data: ~110 public mosque listings (bilingual name/
  description, address, geocoded location), 11 categories, seeded from a
  Google My Maps export plus manually-sourced cover photos for 76 of them.
  No fabricated testimonials, pricing, or press — none exist for this
  product and none should be invented.
- Visual reference: a Claude Design canvas is the documented source of
  truth for existing visual decisions (see root `CLAUDE.md`'s "Design
  reference" section) — treat it as prior art/evidence for an incumbent
  system, not a blank slate.

## Product Principles

- Moderate before publish for listings; publish-then-moderate for reviews —
  deliberately different trust models for different content types.
- Romania-only scope, nationwide within that — not global, not
  Dobrogea-only.
- Bilingual (RO/EN) is a floor for every public POI/blog field, not an
  enhancement.
- No paid infrastructure dependency — every architectural choice (maps,
  storage, hosting) stays free/self-hostable.
- Admin/moderator tooling is a first-class surface, not an afterthought —
  the product depends on real moderation workflows working well.
