# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

## Chunk-one service-demo series (`ChunkOneDesktop` / `ChunkOneMobile`)

`src/ChunkOne.tsx` is chunk 1 of 3 in a service-demo series, registered as two
compositions at the bottom of `src/Root.tsx`:

- **ChunkOneDesktop** — 1920x1080, 16:9, 30fps (web embeds / YouTube).
- **ChunkOneMobile** — 1080x1920, 9:16, 30fps (IG/TikTok/WhatsApp Status).

Both render the exact same `<ChunkOne>` component tree, 660 frames (22s) at
30fps, driven by the single `BEATS` timing array at the top of `ChunkOne.tsx`.
Aspect ratio is the only thing that differs between them — every component
reads its layout from `src/useLayout.ts` (orientation, scaled spacing/font/icon
sizes off `Math.min(width, height)`) instead of assuming a fixed canvas, so
there's no orientation-specific branching outside that hook and the six
`src/scenes/Beat*.tsx` files.

### Reused `tokens.ts` instead of adding a new `theme.ts`

The brief asked for a `src/theme.ts` with `cream`/`ink`/`accent` colors and the
`cubic-bezier(0.32, 0.72, 0, 1)` easing. `src/tokens.ts` already defined
exactly those (`COLORS`, `EASE`, `easedInterpolate`) for the three existing
`paket-*-explainer` compositions — adding a second file with the same values
would've created two competing sources of truth for the same colors. Chunk-one
imports from `tokens.ts` and it's been extended with `withAlpha()` (hex → rgba,
for the ambient texture and tinted chip borders) and `SPRING_CONFIG` (the
shared damping-13 overshoot spring). `fonts.ts` (Manrope via
`@remotion/google-fonts`) was reused as-is.

### Coded placeholders vs. finished components

**Coded placeholders — replace when real designs land:**
- `src/components/mocks/StorefrontMock.tsx` — the storefront UI inside the
  BrowserFrame in Beat1/Beat3. Now a representative coded commerce
  site (nav + search + cart, promo hero, priced product grid with buy
  buttons) built from theme tokens and Manrope, not a gray-box placeholder;
  still swappable for `public/assets/mockups/storefront-placeholder.png`.
  Product tiles are filled with real bag photos
  (`public/assets/mockups/bag-*.jpg`, downscaled from the basic-package
  folder's Unsplash shots, wired through `PRODUCT_PHOTOS` in `assets.ts`);
  swap per-product images by replacing those files or editing `PRODUCTS`.
- `src/components/mocks/SellerDashboardMock.tsx` — the merchant back-office
  UI inside the BrowserFrame in Beat4 (sidebar nav, omzet headline, weekly
  bar chart, stat tiles), with the four capability chips fanning out around
  it. Coded from theme tokens + Manrope.
- `src/components/mocks/DashboardMock.tsx` — the order list + horizontal
  delivery tracker. No longer rendered by any beat (Beat 5 now morphs a
  CRM contact-list card into a "Pelanggan Terlayani" circle); kept for reuse.
- `public/assets/mockups/` holds the `bag-*.jpg` product photos so far — per
  the brief's own "or leave as coded placeholder" allowance, no fake
  storefront/dashboard PNGs were generated. Swapping in real mockup images means adding the files at
  those exact names and rendering them inside `BrowserFrame` instead of the
  mock components.

**Finished / functional, not placeholders:**
- Shared components in `src/components/` (BackgroundAmbient, LogoMark,
  IconChip, HighlightText, ParticleDot, BrowserFrame, RevenueChart — the
  Beat 6 monthly-revenue bar/trend chart that replaced the old StatCurve
  line).
- `public/assets/icons/*.svg` and `public/assets/logos/niskala-mark.svg` —
  real vector SVGs, not hand-drawn approximations, so nothing renders as a
  broken image out of the box. `browser`, `cart`, `growth_chart`,
  `people_group` and `shopping_bag` are the branded set (accent `#E8562A`,
  from `public/assets/basic package niskala video assets/` — `shopping_bag`
  is a brand-neutral Phosphor bag, deliberately not the Shopee-style mark
  shipped in that folder); the rest are Phosphor "regular" weight in ink
  `#2B2620`. Each file bakes its fill in directly, since a static SVG in
  `public/` can't reference `tokens.ts` — to restyle one, keep the same
  filename and viewBox proportions and it's a zero-line swap.
  `public/assets/logos/` holds the real Niskala brand marks (copied from the
  main site): `niskala-mark.svg` (the "Ni" monogram — the Beat 2 gate) and
  `niskala-logo.svg` (mark + wordmark — available if needed; Beat 6's
  sign-off pairs the mark with a Manrope "Niskala" wordmark).
- `public/fonts/` is empty (`.gitkeep` only) — Manrope currently loads via
  `@remotion/google-fonts` in `fonts.ts`; this folder is only needed if that
  changes to self-hosted font files later.

### Open design questions (not resolved silently — see brief)

- Icon tint is currently fixed at ink (`#2B2620`) inside most SVG files.
  `SellerDashboardMock`'s sidebar mixes ink icons with the one accent-tinted
  `people_group`, and dims the inactive ones in code — a matched cream/ink
  icon set would look cleaner if real assets are exported.
- `DashboardMock.tsx`'s portrait `OrderCards` layout was flagged as an open
  question; the component is no longer used by any beat, so the question is
  moot unless it's brought back.
