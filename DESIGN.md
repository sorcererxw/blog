---
name: sorcererxw Personal Site
description: An exacting public identity surface for writing, projects, and social notes.
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.153 0.006 107.1)"
  card: "oklch(1 0 0)"
  card-foreground: "oklch(0.153 0.006 107.1)"
  primary-ink: "oklch(0.228 0.013 107.4)"
  primary-foreground: "oklch(0.988 0.003 106.5)"
  muted-surface: "oklch(0.966 0.005 106.5)"
  muted-foreground: "oklch(0.58 0.031 107.3)"
  border: "oklch(0.93 0.007 106.5)"
  ring: "oklch(0.737 0.021 106.9)"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(2.75rem, 6vw, 4.75rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(2rem, 3vw, 2.75rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Roboto Slab, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.375
    letterSpacing: "normal"
  body:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  2xl: "1.125rem"
  4xl: "1.625rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-ink}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  card-feed:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "1rem"
  badge-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.4xl}"
    padding: "0.125rem 0.5rem"
    height: "1.25rem"
---

# Design System: sorcererxw Personal Site

## 1. Overview

**Creative North Star: "The Field Notebook"**

The visual system should feel like a precise working notebook made public: authored, technical, and selective. It is not a neutral blog archive, and it is not a marketing funnel. The homepage introduces the author, then lets writing, projects, and social notes sit in one readable stream.

The current system is restrained and information-dense. It uses warm gray OKLCH neutrals, editorial serif headings, compact controls, and media-led feed modules. The surface should stay calm enough for long reading while still feeling designed through deliberate type scale, tight source labels, durable links, and real content imagery.

It explicitly rejects template blog chrome, SaaS hero patterns, admin dashboard density, identical project-card grids, gradient text, glass panels, decorative blobs, oversized hero metrics, and vague "modern personal brand" copy.

**Key Characteristics:**

- One public identity surface, not separate archive pages.
- Editorial reading rhythm with utilitarian controls.
- Light, warm-neutral default theme.
- Flat surfaces with ring and tonal layering before shadows.
- Real content media for feed and article emphasis.

## 2. Colors

The palette is a restrained warm-neutral system: near-white paper, low-chroma olive-gray ink, and subtle tonal surfaces.

### Primary

- **Olive Ink** (`oklch(0.228 0.013 107.4)`): Primary actions, active filter pills, high-emphasis links, and compact UI contrast.
- **Ink on Paper** (`oklch(0.153 0.006 107.1)`): Body foreground, major headings, and card text.

### Secondary

- **Warm Ash Surface** (`oklch(0.966 0.005 106.5)`): Muted panels, code chips, filter backgrounds, and low-emphasis UI surfaces.
- **Ash Voice** (`oklch(0.58 0.031 107.3)`): Dates, source labels, supporting copy, and secondary navigation.

### Neutral

- **Paper** (`oklch(1 0 0)`): Page background, card background, and popover background.
- **Hairline Ash** (`oklch(0.93 0.007 106.5)`): Borders, separators, table rules, media frames, and form inputs.
- **Soft Focus Ring** (`oklch(0.737 0.021 106.9)`): Focus outlines and ring treatments.

### Named Rules

**The Ink Rarity Rule.** Use Olive Ink for active states and deliberate emphasis, not for decorative blocks.

**The Warm Neutral Rule.** Keep surface colors low-chroma and slightly warm. Do not introduce cold blue-gray defaults unless a specific content need requires them.

## 3. Typography

**Display Font:** Newsreader, with Georgia and serif fallback.
**Body Font:** Outfit, with system-ui and sans-serif fallback.
**Label/Mono Font:** Instrument Sans for compact UI labels; SFMono-Regular / SF Mono for code.

**Character:** The type system mixes an editorial reading voice with compact software controls. Newsreader carries authored long-form identity; Outfit and Instrument Sans keep navigation, filters, and card metadata utilitarian.

### Hierarchy

- **Display** (600, `clamp(2.75rem, 6vw, 4.75rem)`, 0.98): Article hero headlines and the strongest identity moments.
- **Headline** (500, `clamp(2rem, 3vw, 2.75rem)`, 1.05): Rich text section headings and major content breaks.
- **Title** (500, `1rem` to `1.5rem`, 1.375): Cards, component headings, and compact project/feed titles.
- **Body** (400, `1rem` to `1.05rem`, 1.75 to 1.9): Notion-rendered prose, summaries, descriptions, and article content. Keep long prose near 42rem wide.
- **Label** (500, `0.75rem`, uppercase only for dates and compact metadata): Feed dates, source tags, and small navigation labels.

### Named Rules

**The Authored Serif Rule.** Use the serif for authored content hierarchy, not for every small label or component title.

**The Label Scarcity Rule.** Uppercase tracking is allowed for dates and source metadata; do not repeat tiny uppercase kickers as section decoration.

## 4. Elevation

The system is flat by default. Depth comes from tonal layering, 1px rings, borders, image planes, and small transform states. Shadows are allowed only as light structural assistance on floating overlays or project cards, never as a generic card recipe.

### Shadow Vocabulary

- **Surface Ring** (`ring-1 ring-foreground/10`): Default card separation without visible lift.
- **Popover Lift** (`shadow-md ring-1 ring-foreground/10`): Select dropdowns and floating Base UI popups.
- **Project Hover Shadow** (`0 14px 32px -28px color-mix(in oklab, var(--foreground) 25%, transparent)`): Rare hover depth for project cards.

### Named Rules

**The Flat-At-Rest Rule.** Cards and feed modules sit on the page rather than floating above it. Add lift only for hover, focus, or true overlay behavior.

## 5. Components

### Buttons

- **Shape:** Rounded but compact (`var(--radius-lg)`, 0.625rem).
- **Primary:** Olive Ink background with near-paper text; default height is 2rem with compact horizontal padding.
- **Hover / Focus:** Use opacity/tone shifts plus visible ring. Active press may translate down by 1px.
- **Secondary / Ghost / Link:** Keep background mostly transparent or muted. Link buttons use underline on hover, not decorative color blocks.

### Chips

- **Style:** Filter chips and badges use pill shapes, outline borders, compact padding, and label-scale text.
- **State:** Selected filters invert to foreground background with page-background text. Unselected filters stay transparent with a hairline border.

### Cards / Containers

- **Corner Style:** Feed and component cards use `rounded-xl`; article hero media may use `rounded-2xl`.
- **Background:** Default cards use Paper/Card. Muted cards use Warm Ash Surface or a low-percentage `color-mix`.
- **Shadow Strategy:** Ring first, shadow rarely. Feed cards should not become a heavy shadow grid.
- **Border:** Use Hairline Ash, foreground at low alpha, or ring utilities.
- **Internal Padding:** Compact cards use 1rem; standard feed modules use 1.25rem; feature modules can use 1.5rem.

### Inputs / Fields

- **Style:** Transparent background, Hairline Ash border, compact 2rem control height.
- **Focus:** Border shifts to Soft Focus Ring with a 3px translucent ring.
- **Error / Disabled:** Destructive color only for invalid/error states; disabled states reduce opacity and remove pointer interaction.

### Navigation

- **Style:** Header and footer use a subtle tonal mix of background and card. The wordmark uses serif type with the favicon mark.
- **States:** Active routes underline with offset; inactive routes use muted foreground and transition to foreground on hover.
- **Mobile:** Navigation wraps instead of collapsing into a hidden menu. Keep links readable and avoid horizontal overflow.

### Overview Feed

- **Style:** URL-backed filter chips above a responsive feed. SSR renders a single-column fallback; hydrated tablet and desktop views may calculate masonry columns.
- **Modules:** Media is cropped decisively, usually 16:10 for single images. Text uses serif titles for non-Telegram items and quieter body text for summaries.
- **Motion:** Filter changes animate opacity and small translate/scale changes, with reduced-motion support.

### Article Detail

- **Style:** Article pages use large image-led hero blocks with dark overlay and serif display headlines.
- **Reading Width:** Rich article content stays near 42rem for readable prose.
- **Rich Content:** Code, callouts, bookmarks, tables, and images use the same ring/border/radius vocabulary as the rest of the site.

## 6. Do's and Don'ts

### Do:

- **Do** lead with identity, then evidence: the Profile Hero comes before the Overview Feed.
- **Do** keep writing, projects, and social posts visually unified in the homepage feed.
- **Do** use OKLCH semantic tokens from `src/app/globals.css` as the source of truth.
- **Do** preserve cover images and content media as part of the public design language.
- **Do** keep prose readable with long-form content near 42rem and body line-height around 1.75 to 1.9.
- **Do** use visible focus rings and semantic links for keyboard and screen-reader access.

### Don't:

- **Don't** make the site feel like a template blog archive.
- **Don't** make it feel like a SaaS landing page, an admin dashboard, or a portfolio full of identical project cards.
- **Don't** use gradient text, glassy panels, decorative blobs, repeated icon-card grids, oversized hero metrics, or vague "modern personal brand" copy.
- **Don't** reintroduce `/blog` as a primary product surface; writing belongs in the homepage overview feed and article detail pages.
- **Don't** use side-stripe borders as card accents. Use full borders, icons, source labels, or tonal surfaces instead.
- **Don't** communicate state by color alone, clip text, or allow horizontal overflow on mobile.
