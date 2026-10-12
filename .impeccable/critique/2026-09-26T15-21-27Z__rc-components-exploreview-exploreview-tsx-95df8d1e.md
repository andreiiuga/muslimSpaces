---
target: Explore and search functionality
total_score: 19
max_score: 36
na_heuristics: 10
p0_count: 2
p1_count: 3
target_identity: "file:/Users/andreiiuga/Projects/muslimSpaces/apps/web/src/components/ExploreView/ExploreView.tsx"
target_fingerprint: "sha256:8f057496386eb6e3bed3b8151b511100a955dfd7df32da3acefa01f371f7b151"
target_path: /Users/andreiiuga/Projects/muslimSpaces/apps/web/src/components/ExploreView/ExploreView.tsx
timestamp: 2026-09-26T15-21-27Z
slug: rc-components-exploreview-exploreview-tsx-95df8d1e
closed: true
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Filter/search refetches are silent once results exist — no skeleton/spinner. **Corroborated by network evidence**: every search submission's Next.js RSC navigation request returns **503**, silently, with no user-visible error — the page only appears to work because a separate direct fetch to the backend (port 3001) happens to populate results anyway. |
| 2 | Match System / Real World | 3 | Romanian copy fits the audience; the zero-result string ("Niciun loc în această zonă încă" — "no place in *this area*") is worded for a location problem and reused verbatim for category and keyword zero-results, which have nothing to do with map area. |
| 3 | User Control and Freedom | 2 | No visible "clear search"/"clear filters" control; category + Open Now aren't reflected in the URL (only `q` is), so a refresh silently drops them. |
| 4 | Consistency and Standards | 2 | The same POI shows two different names depending on whether you read its map pin (English) or its card (Romanian) — confirmed live via a real search ("cluj" → results). Empty-state rendering logic also differs between Map mode (unconditional, confirmed live) and List mode (conditional, correct). |
| 5 | Error Prevention | 2 | No guardrail against a filter/search combination dead-ending into 0 results with a stranded map camera — confirmed live (a zero-result search left the map centered on an unrelated street from a prior action). |
| 6 | Recognition Rather Than Recall | 3 | Map/List and Open Now are icon+text, not icon-only; niche terms (Jamiah/Musallah) go unexplained, and pin emoji are ambiguous at low zoom. |
| 7 | Flexibility and Efficiency | 1 | Only the text query is URL-shareable/persistent; category and Open Now are transient client state; no keyboard shortcuts, no saved/recent search. |
| 8 | Aesthetic and Minimalist Design | 3 | The cream/white/teal restraint genuinely holds up once populated — confirmed both by design review and by the injected detector's own overlay reading the live palette. Edge states (empty, error) undercut it by feeling unfinished. |
| 9 | Error Recovery | 1 | The one error string offers no retry action; zero-result dead ends (category or search) offer no recovery path at all. |
| 10 | Help and Documentation | n/a | Single-screen browse/filter tool — nothing here plausibly needs dedicated help beyond the labels themselves. |
| **Total** | | **19/36** | **Acceptable (53%)** — applicable max is 36 (H10 n/a) |

## Design Specificity Verdict

**LLM assessment**: Thin. The specificity lives almost entirely in copy and taxonomy — the tagline "Locurile ținute de comunitate," the "128 LOCURI" dateline, category names like Jamiah/Musallah — not in any interaction or layout decision. Strip that copy out and this is structurally identical to any Yelp/Airbnb-style listings app: pill category filter row → Open-Now toggle → Map/List segmented switch → card with thumbnail/rating/bookmark, or a MapLibre view with clustered pins and a floating selected-place card. The one place a real point of view shows up is the map's per-category pin icons — a genuine, product-specific attempt — undercut by inconsistent naming (see Priority Issues) and emoji-as-icon's cross-platform rendering risk.

**Deterministic scan**: The CLI detector returned 3 findings against the surface's own files, all `design-system-font-size` (advisory): `ExploreView.tsx:216`/`226` (13px) and `HeaderBar.tsx:87` (20px). **These are stale, not new signal** — this exact rule+value+file combination was already reviewed and given a sanctioned exception in `.impeccable/config.json` earlier this session (the mode-toggle's deliberate compact-mobile size, and the brand wordmark's one-off sizing), and CLAUDE.md documents the type ramp as an intentional coarse approximation, not an exact-match requirement. They resurfaced only because the scan was run with repo-root-relative paths instead of the `apps/web`-relative paths the ignore entries are scoped to — a tooling path-matching quirk, not a fresh defect.

**Visual overlays**: The injected browser-console detector (running against the live, computed page) returned 3 findings:
- **`cramped-padding`** on the Map/List mode-toggle segmented control (`div.flex.overflow-hidden.rounded-pill.border.border-border.bg-surface`) — its children sit flush against the container's border/background with no inset. This is genuinely new information neither Assessment A nor a source read caught — a real, small, fixable gap.
- **`overused-font`** (Plus Jakarta Sans, 89% of visible text) and **`cream-palette`** (the page background) — both **false positives against this system's own stated intent**: DESIGN.md explicitly commits to one typeface system-wide ("no serif or mono is used anywhere") and to a warm cream/white/teal restraint as the entire point of "The Neighborhood Registry" identity. The design review independently praised this same restraint as one of the surface's few things that genuinely works. A generic "is this too monotone" heuristic isn't wrong to flag it, but it's not actionable here.

## Overall Impression

The surface delivers real warmth in its best moments — the tagline, the dateline, the map's fly-in-and-orbit selection — but that warmth collapses at exactly the states a real user with ~110 Dobrogea-concentrated listings will hit constantly: any category or search that comes up empty. The single biggest opportunity is treating the zero-result state as a first-class, on-brand screen instead of a leftover string, since it's not an edge case here — it's a mainline outcome.

## What's Working

1. **The tagline + dateline** ("Locurile ținute de comunitate" / "128 LOCURI") — genuinely authored voice that states the communal-curation premise before the user does anything.
2. **The One Accent Rule is actually upheld** — teal appears only on the selected Map/List segment, selected chips, and the primary CTA; everything else is honestly ink-on-cream, confirmed both by source reading and by the live computed-style overlay.
3. **The map selection interaction** (fly-to + tilt + orbit + the floating "Elevated"-shadow preview card) is a distinctive touch most map/list hybrids skip.

## Priority Issues

**[P0] Map-mode empty-state text renders unconditionally, contradicting real results on screen**
- **What**: `apps/web/src/components/ExploreView/ExploreView.tsx:254` prints the empty-state text after every Map-mode list regardless of whether results exist. Confirmed twice independently — once from source, once live: toggling "Deschis acum" surfaced one real result ("Moscheea Centrala") with "Niciun loc în această zonă încă" printed directly beneath it.
- **Why it matters**: A directory whose whole pitch is trustworthy curation telling the user "there's nothing here" next to something that is, in fact, there reads as broken software.
- **Fix**: Gate that line behind the visible-results count being zero, mirroring the conditional already used correctly in the List-mode branch two lines away.
- **Suggested command**: harden

**[P0] Category/search zero-results are unguided dead ends, with mismatched copy and a stranded map**
- **What**: A sparse category or a no-hit search shows only the location-worded empty string with no next step; in Map mode the camera is left wherever it last was rather than resetting — confirmed live (a zero-result search left the map centered on an unrelated street from a prior action).
- **Why it matters**: Given ~110 POIs concentrated in Dobrogea, this isn't an edge case — anyone browsing outside that region, or filtering to a thin category, hits this as a mainline experience on the highest-traffic page.
- **Fix**: Rewrite copy per actual cause ("Niciun rezultat pentru „…"" / "Încă nu avem locuri în această categorie"), add a one-tap reset, and re-center the map to the national default instead of leaving it stranded.
- **Suggested command**: onboard

**[P1] Every search submission silently fails its framework navigation request**
- **What**: New finding from live network capture — submitting the header search triggers a client-side URL update whose Next.js RSC navigation request returns **503** on every attempt (reproduced twice independently). The page only appears to work because `ExploreView` separately fetches results directly from the backend API; the framework-level request is failing silently underneath with no visible error and no investigation trail for whoever eventually has to debug it.
- **Why it matters**: A search feature that "works" only because of a coincidental fallback path is fragile — the actual mechanism is not what it appears to be, and the masked failure means nobody will notice if the fallback itself breaks until the entire search feature goes dark with no error surfaced anywhere.
- **Fix**: Investigate why the RSC navigation payload request 503s on every search submission (likely something in how `force-dynamic` + client-router `push` interacts with this route) and fix the root cause rather than relying on the parallel client fetch to mask it.
- **Suggested command**: harden

**[P1] The same POI shows two different names depending on map pin vs. card**
- **What**: The map pin renders a POI's English name while its card/preview hardcodes the Romanian name — neither path reads the active locale, unlike the category label nearby which does it correctly. Confirmed live: a real search surfaced results whose displayed name differed by surface.
- **Why it matters**: This is the product visibly disagreeing with itself about a place's name on one screen — exactly the kind of defect that erodes the "carefully kept, not a scrape" trust the design system exists to signal.
- **Fix**: Route both the pin label and the card title through the same locale-aware name picker already used elsewhere in the codebase.
- **Suggested command**: harden

**[P1] No visible focus state anywhere, plus a WCAG-failing text color on the header's language toggle**
- **What**: No `focus-visible` styling exists on any interactive component (buttons, chips, inputs all confirmed to set `outline-none` with nothing in its place) — a gap DESIGN.md itself already flags as unaddressed. Separately, the header's unselected language code renders at roughly 2.45:1 contrast against its background, well under WCAG AA's 4.5:1 minimum for that text size.
- **Why it matters**: A keyboard-only user cannot see which control currently has focus anywhere on the page; a low-vision user cannot read the unselected language option at all.
- **Fix**: Add a visible teal focus ring (consistent with the one-accent rule) to every interactive primitive, and move that text color onto a token with adequate contrast.
- **Suggested command**: audit

**[P2] 12 unsegmented category chips exposed at once, with no grouping by relevance**
- **What**: All 11 categories plus "Toate" render in one flat row with no distinction between data-rich categories (Mosque, Musallah, Restaurant) and near-empty ones (Lawyers, Clothing) — confirmed live.
- **Why it matters**: This single control drives 4 of 8 cognitive-load checklist failures (chunking, one-thing-at-a-time, minimal-choices, progressive-disclosure) on the app's primary, highest-traffic surface.
- **Fix**: Promote categories that actually have listings into the always-visible row; fold sparse ones behind a secondary "more" affordance.
- **Suggested command**: distill

## Persona Red Flags

**Jordan (confused first-timer — closest match to this product's real audience)**
- Faces 12 flat category chips including Islamic-specific terms (Jamiah, Musallah) with no inline explanation distinguishing them from "Moschee."
- Filtering to a thin category returns a location-worded empty message likely read as "the app is geolocating me wrong," with no offered next step.
- The unannounced fly-in + tilt + orbit on first pin tap can read as the page malfunctioning rather than a deliberate flourish.

**Riley (deliberate stress tester)**
- Toggling "Deschis acum" surfaces a listing literally named "Moscheea Centrala" at "Str. Test 2" — seed/placeholder-looking data live in a directory whose entire pitch is careful moderation.
- A zero-result search leaves the map camera parked on an unrelated street from a prior session action rather than resetting.
- The search feature's underlying framework request fails on every single submission (503) — the kind of thing a stress tester finds immediately by watching the network tab, even though the visible UI papers over it.

**Sam (accessibility-dependent, screen reader/keyboard-only)**
- No focus-visible styling exists anywhere in the component set; a keyboard-only user cannot tell which of 12 chips or the search field is currently focused.
- The unselected locale code renders at ~2.45:1 contrast, failing WCAG AA.
- The map's continuous orbit animation on pin selection has no `prefers-reduced-motion` check anywhere in the codebase — a vestibular-sensitive user gets an indefinite spinning camera they never opted into.

## Minor Observations

- The Map/List mode-toggle's segmented-control container has cramped internal padding — its buttons sit flush against the pill's own border with no inset (caught by the live detector overlay, not the source review).
- The dateline badge ("128 LOCURI") duplicates the same count already shown in the page's big heading.
- "New" as the zero-review fallback label reads oddly for a place of worship — a centuries-old mosque isn't "new," it just has no reviews yet.
- "Toate" (pill-fill selection) and "Open now" (checkbox-style selection) use two different visual idioms for conceptually similar binary toggles.
- Map cluster bubbles are click-to-zoom only, with no click-to-preview-list — a curious user must zoom in stepwise to see what's inside a large cluster.
- MapLibre's default zoom control (unstyled, top-right) is the one clearly third-party-looking element on an otherwise cohesive page.
- Emoji-as-pin-icon means a category's marker renders differently across Apple/Windows/Android emoji sets, with no guarantee it reads as intended everywhere.

## Questions to Consider

1. What if the empty/zero-result state were designed as a first-class screen — surfacing categories that do have data — turning the Dobrogea-heavy dataset's current biggest weakness into a discovery feature instead of a dead end?
2. What if the fly-in/tilt/orbit camera move were reserved for a deliberate "explore this place" action instead of firing on every single marker tap, so browsing several pins in a row doesn't fight a forced animation each time?
3. What if the 12 category chips were split into "has places today" and "more," so the visible decision surface shrinks toward the ~4-item working-memory limit instead of a flat wall of options?
