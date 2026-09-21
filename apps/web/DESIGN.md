---
name: MuslimSpaces
description: Find mosques, halal restaurants, Islamic learning centers, and services for Muslims in Romania.
colors:
  primary: "#0F766E"
  primary-dark: "#0B564F"
  primary-light: "#CCFBF1"
  soft-cream: "#FFFBF5"
  surface: "#FFFFFF"
  border: "#E7E2D8"
  text: "#1C1917"
  text-body: "#292524"
  text-muted: "#78716C"
  text-faint: "#A8A29E"
  danger: "#DC2626"
  danger-dark: "#B91C1C"
  success: "#15803D"
  warning: "#D97706"
  star: "#F59E0B"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, IBM Plex Sans Arabic, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.7px"
  headline:
    fontFamily: "Plus Jakarta Sans, IBM Plex Sans Arabic, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.5px"
  title:
    fontFamily: "Plus Jakarta Sans, IBM Plex Sans Arabic, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.1px"
  body:
    fontFamily: "Plus Jakarta Sans, IBM Plex Sans Arabic, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Plus Jakarta Sans, IBM Plex Sans Arabic, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "1.3px"
rounded:
  sm: "8px"
  md: "12px"
  input: "14px"
  lg: "16px"
  xl: "24px"
  cardLg: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary-dark}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.danger-dark}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  chip-unselected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.input}"
    padding: "8px 12px"
---

# Design System: MuslimSpaces

## Overview

**Creative North Star: "The Neighborhood Registry"**

MuslimSpaces reads as a warm, hand-kept community ledger, not a venture-backed consumer app. Its job is to make a moderated, community-curated directory of mosques, halal businesses, and services feel trustworthy and welcoming — the opposite of a slick, anonymous listings site. A soft cream canvas, a single restrained teal accent, and generous rounded geometry carry that warmth; nothing about the surface competes with the actual content (place names, photos, addresses) for attention.

The teal accent (`#0F766E`) is a deliberate, confirmed departure from the coral-and-black gig-economy-app palette (Airbnb, Uber, and their many imitators) — this project exists specifically to *not* read as another one of those. Warmth here comes from the cream background and soft shadows, not from a loud accent color; the teal is reserved almost entirely for the primary action and the selected state, so its rarity keeps it legible as "this is the one thing to notice" rather than becoming wallpaper.

**Key Characteristics:**
- Warm cream background (`#FFFBF5`), white surfaces, soft near-flat shadows — never stark white-on-white or harsh drop shadows.
- Teal used sparingly: primary buttons, selected chips/tabs, active states. Everything else stays neutral ink-on-cream.
- Pill-shaped buttons and chips throughout; generous corner radii on cards and inputs (12–24px).
- Bilingual by default (Romanian primary, English secondary) — Arabic script support (IBM Plex Sans Arabic) is wired into the font stack for any Arabic-script content, distinct from the primary Latin type.

## Colors

A warm, low-saturation palette built around one accent color used deliberately sparingly.

### Primary
- **Quiet Emerald** (`#0F766E`): the single accent — primary buttons, selected filter chips, active tab indicator, links, category label text. Its restraint is the point; it should never appear as a large fill or background wash.
- **Quiet Emerald, Dark** (`#0B564F`): text-on-light-teal (e.g. the secondary button variant's label) and pressed/active states.
- **Quiet Emerald, Light** (`#CCFBF1`): the secondary button's fill, and any "tinted teal" background chip or badge.

### Neutral
- **Soft Cream** (`#FFFBF5`): the page background. Never pure white — this warmth is load-bearing for the "welcoming, not clinical" character.
- **Surface White** (`#FFFFFF`): cards, inputs, the header bar — anything that needs to read as a raised/contained surface against the cream page.
- **Border** (`#E7E2D8`): hairline borders on cards, inputs, and dividers between sections.
- **Ink** (`#1C1917`): headings and short labels.
- **Ink, Body** (`#292524`): a shade lighter than heading ink, reserved for long-form paragraph text (descriptions, review/blog body copy) — reads as "ink on paper" for reading-length text without competing with headings.
- **Ink, Muted** (`#78716C`): metadata — addresses, dates, captions, secondary line under a title.
- **Ink, Faint** (`#A8A29E`): the lightest text tone — chevrons, counts, near-disabled affordances.

### Semantic
- **Danger** (`#DC2626` / dark `#B91C1C`): destructive actions and error text. Rendered as an outline pill (light red fill + red border), never a solid red fill, so it reads as "careful" rather than alarming.
- **Success** (`#15803D`): confirmation states.
- **Warning** (`#D97706`): "Open now" and similar caution states.
- **Star** (`#F59E0B`): rating stars only.

### Named Rules
**The One Accent Rule.** Teal is the only color allowed to signal "this is interactive/primary" — never introduce a second accent hue. If something needs more visual weight than teal can carry, use size, weight, or whitespace instead of a new color.

## Typography

**Display/Body Font:** Plus Jakarta Sans (with IBM Plex Sans Arabic for Arabic-script content, then `system-ui, sans-serif`)

**Character:** A single warm, rounded-terminal sans serif carries every role, from page headings down to uppercase kickers — no serif or mono is used anywhere. The pairing with IBM Plex Sans Arabic exists specifically so Arabic-script names/content (a real content type for this product) render in a matching-weight companion face rather than a mismatched system fallback.

### Hierarchy
- **Display** (600, 34px, -0.7px tracking): page-level headings, e.g. Explore's "Locurile ținute de comunitate".
- **Headline** (600, 28px, -0.5px tracking): section-level headings.
- **Title** (600, 18px, -0.1px tracking): card titles (POI name, blog post title).
- **Body** (400, 16px, normal tracking): paragraph text, addresses, descriptions. No enforced max line length is set in code today.
- **Label** (500, 12px, +1.3px tracking, uppercase in use): category kickers ("MOSCHEE"), the dateline count, section eyebrows. The widest tracking in the scale — deliberately, since it's used almost exclusively uppercase.

### Named Rules
**The Whisper-Kicker Rule.** Every uppercase label uses the same 12px/+1.3px-tracking treatment, in muted or primary-dark ink, never in the loudest ink color. It should read as a quiet category tag, not a shout.

## Layout

Content lives in a centered column (max-width 1340px) with responsive horizontal padding (`clamp(16px, 4vw, 28px)`). The Explore surface's map+list layout is two flex columns, not a full-bleed map with floating glass panels: a bordered, rounded (22px) map sits beside a scrollable list column (max-width 460px), both inside the normal page column. Below an 860px breakpoint the two stack vertically instead of sitting side by side, and the map's height collapses to a shorter clamp(320px, 60vh, 480px) band. The admin section uses its own two-column shell (sidebar + content) that collapses to a stacked, horizontally-scrolling nav below 768px. Spacing follows the 4/8/12/16/24/32/48px scale throughout — no arbitrary one-off values.

## Elevation & Depth

Flat by default. Cards at rest carry only a whisper-soft ambient shadow (`0 1px 3px rgba(28,25,23,.08), 0 1px 2px rgba(28,25,23,.06)`) — barely perceptible, just enough to separate a white surface from the cream page behind it. A stronger shadow (`0 8px 24px rgba(28,25,23,.16)`) is reserved specifically for elements that are visually floating *over* other content — the selected-POI preview card that overlays the map, modal-style overlays — not used as a general "more important = more shadow" scale.

### Shadow Vocabulary
- **Card** (`0 1px 3px rgba(28,25,23,.08), 0 1px 2px rgba(28,25,23,.06)`): default resting shadow for any card/surface (POICard, admin table rows treated as cards, etc.).
- **Elevated** (`0 8px 24px rgba(28,25,23,.16)`): floating-over-content elements only — the map's selected-POI preview card, dropdowns, anything overlaying other UI.

### Named Rules
**The Floating-Over Rule.** The stronger "elevated" shadow means "this is physically overlapping something else on screen right now," not "this is more important." A regular list card never earns it just for emphasis.

## Shapes

Rounded and soft throughout — no sharp corners anywhere in the system. The radius scale runs from 8px (small chips/tags) through 12px (default), 14px (form inputs specifically), 16px (cards), 20px (larger blog-style cards), 24px (the Explore map container), up to a full pill (999px) for every button and chip. Borders are hairline (1px, `#E7E2D8`) and used sparingly — most separation comes from shadow + background contrast rather than visible strokes; a border appears mainly on inputs, the map container, and ghost/outline button variants.

## Components

### Buttons
- **Shape:** full pill (999px radius) — no button in the system has a lesser radius.
- **Primary:** solid Quiet Emerald fill, white text, soft teal-tinted shadow (`0 4px 14px rgba(15,118,110,.28)`) — the system's strongest call-to-action treatment.
- **Secondary:** Quiet-Emerald-Light fill with Quiet-Emerald-Dark text — a lower-emphasis teal option that still reads as "on-brand action," not neutral.
- **Ghost:** transparent fill, ink text, hairline border — the lowest-emphasis option, used for secondary/tertiary actions.
- **Danger:** light-red fill with dark-red text and a red hairline border — deliberately an outline treatment, not a solid red fill, so destructive actions read as "handle with care" rather than alarming.
- No hover/focus treatment is defined in code today beyond the browser default cursor change — a gap to close deliberately rather than by accident if/when this gets audited.

### Chips
- **Style:** pill-shaped, hairline border. Unselected: white surface, ink text, neutral border. Selected: solid Quiet Emerald fill, white text, teal border.
- **Use:** category filters on Explore; the language picker.

### Cards / Containers
- **Corner Style:** 16px radius by default (`radii.lg`); 20px for the taller blog-style card variant.
- **Background:** white surface against the cream page.
- **Shadow Strategy:** the resting "Card" shadow only — see Elevation & Depth.
- **Border:** none by default; cards are separated from the page by shadow + white-on-cream contrast, not a stroke.
- **Internal Padding:** 16px default.

### Inputs / Fields
- **Style:** white surface, 1px hairline border (neutral, or danger-red when in an error state), 14px radius — the one place in the system with its own dedicated radius step, distinct from the general 12px default.
- **Focus:** not explicitly styled — `outline: none` is set with no replacement focus treatment defined in code.
- **Error:** border switches to danger red; an inline error message renders below in danger-red body text.

### POI Card (signature component)
The system's most-used and most content-driven component: a thumbnail (a real cover photo when the POI has one, otherwise an initial-letter placeholder tinted Quiet-Emerald-Light) beside a category kicker, title, address, and star rating. Two layouts share the same visual language — a horizontal row (thumbnail left) for list contexts, and a taller grid tile (thumbnail on top) for the dedicated list view — so the component's identity survives the layout change intact.

## Do's and Don'ts

### Do:
- **Do** keep the cream (`#FFFBF5`) / white (`#FFFFFF`) two-tone background system — cream for the page, white for anything that needs to read as a raised surface.
- **Do** reserve teal for primary actions and selected states only; let ink-on-cream carry everything else.
- **Do** use full-pill radius (999px) for every button and chip, no exceptions.
- **Do** use the soft "Card" shadow for resting surfaces and save the stronger "Elevated" shadow specifically for things floating over other content.

### Don't:
- **Don't** introduce a second accent color alongside teal — if something needs more visual weight, reach for size/weight/whitespace, not a new hue.
- **Don't** use a solid red fill for destructive actions — the established pattern is a light-red-fill-plus-red-border outline treatment.
- **Don't** reach for a coral/black gig-economy-app palette or a loud, saturated multi-color system — the confirmed rejection this project's teal choice exists to avoid.
- **Don't** add heavy, multi-layer, or glassmorphic shadow/blur effects — the system is deliberately near-flat; depth is rare and purposeful, not decorative.
