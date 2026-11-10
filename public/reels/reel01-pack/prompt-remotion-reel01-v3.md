# Claude Code prompt — Remotion: Reel 01 v2 (VO-synced + realistic iOS-grade UI, coded from reference mockups) · prompt rev. 3

> Paste everything below into Claude Code from the root of the repo that already contains the Reel01 Remotion composition.
>
> **Before pasting:** copy the folders into the repo:
> - the 14 VO files → `public/reels/reel01/vo/`
> - `reel01/reference/` (6 mockup PNGs) → `public/reels/reel01/reference/`
> - `reel01/products/` (6 product PNGs) → `public/reels/reel01/products/`

---

## 00. Assets you have

**Reference mockups** (`public/reels/reel01/reference/`). These are **visual references only. Never place them in the video.** They show the look I want: clean, light, iOS-like spacing and type. They are inconsistent with each other (different phone models, an Android phone, English text, a TikTok-like reel layout, wrong URLs, AI text glitches such as "Sxxtinop" and "24h Cold" twice). Copy their **proportions, spacing, hierarchy and calm feel**. Do not copy their phone frames, their text, their URLs, their reel layout or their glitches.

| File | Use it as reference for |
|---|---|
| `mockup_01_reel.png` | Overall reel screen density and bottom gradient only. Its layout (spinning disc, search icon, "Share" label, centred face) is TikTok-like: **do not copy it**; follow the `ReelScreen` spec in section 5. |
| `mockup_02_sheet.png` | `ProductSheet`: dark sheet over the dimmed reel, 2 × 2 card grid, card styling. |
| `mockup_03_product_page.png` | `IgProductPage`: image card, title, price, colour swatches, size chips, full-width blue button. |
| `mockup_04_store_page.png` | `StorePage`: URL bar, centred store wordmark, product image, uppercase product name, price, swatches, solid dark `ADD TO CART` style button. |
| `mockup_05_checkout.png` | `CheckoutPage`: order summary row, Contact, Delivery fields, solid dark button. |
| `mockup_06_payment_success.png` | New `SuccessScreen` (section 5), used right before the notification in S8d. |

**Product photos** (`public/reels/reel01/products/`). These **are** used in the video.

| File | Role |
|---|---|
| `termos_led_transparent.png` | **The hero product** (`Termos LED 500 ml`). Transparent background. Used in `ProductTagPill` thumbnail, sheet card 1, `IgProductPage`, `StorePage`, `CheckoutPage` thumbnail, `SuccessScreen`. Place it on a light `#F3F4F6` image card on light pages and on `#2A2A2C` on dark cards. The tapped product must be this one on every screen. |
| `termos_led_lightbg.png` | Same product on its original light background (fallback). |
| `botol_silver_darkbg.png`, `botol_hitam_darkbg.png`, `botol_biru_darkbg.png` | Sheet cards 2–4 (dark background, already matches a dark card). |
| `botol_hijau_darkbg.png` | Spare (profile grid tiles). |

The hero photo's LED display reads "150 °C", which is unrealistic. On close zooms keep the image small enough that this is not readable, or cover the display with a clean coded LED readout showing `45°` (`TODO_LED_READOUT`). Report which you chose.

---

## 0. What this is

Reel01 v1 already exists in this repo and **I like it**. This is a **revision, not a rebuild**. Three things change:

1. **Voice-over.** The reel now has a recorded VO (14 WAV files). Scene timing is driven by the audio, not by fixed frame numbers.
2. **Updated copy and flow.** The script changed: a "STOP." hook, a new bridge scene (S7b), S8 condensed to 4 beats, and a new CTA.
3. **Realistic UI components.** Every phone and app element must look like a real iOS app screen (Apple Human Interface quality), but **without any brand**: no Instagram logo or wordmark, no marketplace, courier or Apple logos.

Everything else stays as it is: tokens, camera system, `WordBuild`, the motion feel, backgrounds, black beats, lebay presets, safe zone, dev checks.

Work in stages. After each stage, report and **wait for my confirmation**.

---

## 1. Rule zero: study v1 before touching anything

Before writing any code (Stage 1):

1. Read the whole existing Reel01 implementation: composition, tokens, camera, components, scene files.
2. Render stills of the **current** v1 at the middle of each scene (at least 12 stills), plus the full MP4 if render time allows. Save them to `out/v1-reference/`. These are the visual reference for v2.
3. Write a short **"Keep / Change" list**: for every existing component and scene, say whether v2 keeps it unchanged, adjusts it (what exactly), or replaces it (why).

**Change budget:**
- Do not change tokens, easing curves, `wordIn`, `out`, camera mechanics or the camera hard rules.
- Do not restyle S1–S6. They only get new copy, VO timing and the STOP punch.
- New work goes into the UI components (section 5), S7b, S8, S9 and S10.
- If you think something in v1 should change beyond this, **propose it and wait**. Do not just do it.

---

## 2. Ground rules (every stage)

1. **Copy is verbatim.** On-screen text comes from section 4 exactly. The VO says slightly more words than the screen. That is intended. Do not add the VO's extra words to the screen.
2. **No brands.** No Instagram logo, wordmark, gradient icon or the name "Instagram" inside any UI. No Apple logo. No marketplace or courier names, logos or brand colours. The word "Instagram" may appear only in the **headline copy** listed in section 4, never inside the phone UI. The UI must be recognisable by **layout and behaviour**, not by copied assets or icons.
3. **Unknowns are `TODO` constants or props.** Missing image assets render as a clean neutral placeholder with the TODO name in small text.
4. The camera rules from v1 still apply: camera follows words, no lost context, zoom only into meaningful components, never into a word, max 3 moving elements, no crossfades, no CapCut effects, no typewriter text.
5. Reuse the existing repo conventions. Do not scaffold a second project.

---

## 3. Audio-driven timing

**Files.** Put the VO in `public/reels/reel01/vo/` (I'll copy them there):

`vo_01_hook.wav`, `vo_02_numpang.wav`, `vo_03_promo.wav`, `vo_04_biaya.wav`, `vo_05_omzet.wav`, `vo_06_untung.wav`, `vo_07_solusi.wav`, `vo_07b_bridge.wav`, `vo_08a_reveal.wav`, `vo_08b_tap.wav`, `vo_08c_syarat.wav`, `vo_08d_checkout.wav`, `vo_09_resolusi.wav`, `vo_10_cta.wav`

All files are 48 kHz mono, normalised to about −16 LUFS, already trimmed.

**Mechanics.**
- Use `calculateMetadata` to read each file's duration (use whatever the installed Remotion version recommends, e.g. `parseMedia` from `@remotion/media-parser`, or `getAudioDurationInSeconds` from `@remotion/media-utils`). Do not hard-code durations.
- **Scene duration = VO duration + `padIn` + `padOut`.** Defaults: `padIn` 4 frames, `padOut` 10 frames. Black beats (S2, S6): `padOut` 6 frames. S10: `padOut` 45 frames (end card hold).
- The composition's total duration is the sum of the scene durations. Expected total is about **70 s**. Report the real number.
- Each scene plays its VO in a `<Sequence>` with `<Audio>`.
- **Phrase cues.** Each line of on-screen text starts building at its cue (seconds from the start of that VO file, table in section 4). The first word may start up to 3 frames **before** the cue, so the text never lags the voice.
- If a sentence's words cannot finish building before the next cue, speed up `wordGap` for that sentence (minimum 3 frames). Report where you did this.
- The camera's "pull back and hold" must finish before the VO for that sentence ends. If a hold would fall below 15 frames, report it rather than cropping text.

**Expected durations (for sanity checks only; the code reads the real files):**

| File | Duration | Phrase cues (s) |
|---|---|---|
| vo_01_hook | 6.21 | 0.00 · 1.11 · 2.99 |
| vo_02_numpang | 5.20 | 0.00 |
| vo_03_promo | 3.46 | 0.00 · 1.68 |
| vo_04_biaya | 2.06 | 0.00 · 1.32 |
| vo_05_omzet | 1.97 | 0.00 (see S5) |
| vo_06_untung | 2.46 | 0.00 |
| vo_07_solusi | 5.10 | 0.00 · 3.00 |
| vo_07b_bridge | 3.33 | 0.00 · 1.84 |
| vo_08a_reveal | 5.70 | 0.00 · 3.52 |
| vo_08b_tap | 3.10 | 0.00 · 1.08 |
| vo_08c_syarat | 2.63 | 0.00 · 1.45 |
| vo_08d_checkout | 3.64 | 0.00 · 1.62 |
| vo_09_resolusi | 9.16 | 0.00 · 4.84 |
| vo_10_cta | 13.05 | 0.00 · 2.17 · 6.99 · 8.60 |

**Music** (`TODO_MUSIC`) ducks to about −18 dB under the VO (use a volume callback based on the VO sequences, ramp 6 frames) and sits at full level only between scenes and in the end card hold. SFX slots from v1 stay.

---

## 4. Scene-by-scene (copy, cues, changes vs v1)

**Bold** = accent word (one per sentence, v1 rules). `→` = the next line replaces the previous one.

### S1 · Hook · Mist · `vo_01_hook`
- Cue 0.00: **`STOP.`** — `LebayWord` Punch preset, ink colour (not accent), 300 px world, plus `Shake`. It must already be mid-entrance at frame 0. This is an official exception to the lebay budget (hook only). Note it in the budgets report.
- Cue 1.11: → `Kamu jualan di marketplace?`
- Cue 2.99: → `Jangan biarin toko kamu` / `**mati** di 2027.`
- Camera: v1 behaviour. No zoom into any word.
- Keep the `hookVariant` prop. Variant `plain` = v1 hook without STOP (cue 2.99 text only, shown from frame 0). The VO for the plain variant is `TODO_VO_HOOK_PLAIN`.

### S2 · Black beat 1 · Night · `vo_02_numpang`
- Cue 0.00: `Toko kamu cuma **numpang**` / `di platform orang.`
- Everything else as v1 (flicker, drift, hard cut).

### S3 · Reason 1 · Mist · `vo_03_promo` (shared world with S4–S5, as v1)
- Cue 0.00: `Gak ikut promo?` + the three promo components fly in (v1 motion).
- Cue 1.68: → `**Tenggelam.**` + the components sink.
- Promo components are now **realistic generic promo badges** (section 5, `PromoBadge`), not placeholder pills.

### S4 · Reason 2 · Lebay 1 · Mist · `vo_04_biaya`
- Cue 0.00: `Biaya iklan`
- Cue 1.32: `**NAIK** terus.` — the Punch `NAIK` lands on cue 1.32 exactly (the VO says "naik" right there).
- `RisingLine` as v1, but it starts drawing at cue 0.00 so it peaks with NAIK. Allowed zoom: line tip, as v1.

### S5 · Reason 3 · Lebay 2 · Mist · `vo_05_omzet`
- Cue 0.00: `Omzet?` then the Squash `Segitu-segitu` / `aja.` Time the Squash landing to about 0.85 s into the file (the VO says "segitu" there). Check it by ear and report the frame you used.
- `FlatLine` as v1.

### S6 · Black beat 2 · Night · `vo_06_untung`
- Cue 0.00: `Kamu yang kerja,` / `platform yang **untung**.` As v1.

### S7 · Solution · Mist · `vo_07_solusi`
- Cue 0.00: `Bukan tutup toko.`
- Cue 3.00: → `Buka **jalur jualan** sendiri.`
- The plum dot from v1 pops in below at the end of the scene.

### S7b · Bridge · Mist · `vo_07b_bridge` (NEW)
- Cue 0.00: the dot morphs (`MorphBox`) into `PhoneShell`, showing `ProfileScreen` for the store **tokokamu** (section 5).
- Cue 1.84: headline `Mulai dari **Instagram** kamu.` above the phone.
- Camera: pull back to frame headline + phone. Allowed zoom: none (this is an establishing shot).
- At the end, a tap on the first reel tile in the grid pushes into `ReelScreen` (start of S8).

### S8 · The white-cart flow · Mist · `vo_08a` → `vo_08d` (condensed from 6 steps to 4 beats)

Same phone, continuous; each beat is one VO file played back-to-back.

| Beat | VO | Headline (cue) | Phone action | Allowed zoom |
|---|---|---|---|---|
| 8a | `vo_08a_reveal` | 0.00 `Reels kamu bisa dipasang` → 3.52 `**keranjang putih**.` | `ReelScreen` plays. At cue 3.52 the `ProductTagPill` pops in (`easePop`) and pulses once. | Zoom to the `ProductTagPill` (1.8) right after it lands |
| 8b | `vo_08b_tap` | 0.00 `Sekali tap,` → 1.08 `langsung ke **website kamu**.` | Tap on the pill → `ProductSheet` slides up → tap on the first card → `IgProductPage` pushes → tap on `Lihat di website`. Compress the sheet to about 18 frames: this is a quick montage. | Zoom to the `Lihat di website` button |
| 8c | `vo_08c_syarat` | 0.00 `Syarat utamanya:` → 1.45 `punya **website sendiri**.` | `InAppBrowser` slides up, progress bar fills, URL bar shows `tokokamu.com`. | Zoom to the URL bar (the most important zoom in the reel; hold it until the VO line ends) |
| 8d | `vo_08d_checkout` | 0.00 `Checkout di toko kamu.` → 1.62 `**Tanpa potongan** marketplace.` | `StorePage` → tap `Beli sekarang` → `CheckoutPage` (auto-scroll to `Bayar sekarang`, tap) → `SuccessScreen` → `IosNotification` "Pesanan baru masuk · Termos LED 500 ml · Rp450.000" drops from the top of the phone at cue 1.62. Keep each screen short; this is a montage. | Zoom to the order total, then to the notification |

- Every headline must be fully readable before the camera zooms into the phone (hold ≥ 15 frames).
- Each zoom lands on the exact element the next tap hits.
- Only prices appear as numbers, and only inside the UI.

### S9 · Resolution · Mist · `vo_09_resolusi`
- Cue 0.00: `Marketplace tetap jalan.`
- Cue 4.84: → `Instagram bawa **pembeli baru**.`
- Visual: the phone shrinks back (pull back) and **new-buyer signals** appear around it, one by one, max 3 on screen: small `IosNotification` cards `Pesanan baru masuk`, a `FollowerToast` "+1 pengikut baru" and a `DmBubble` "Kak, masih ada?". They stagger in on the second line (cue 4.84+), not before.
- This scene is long (about 9 s). Keep it alive with the stagger and a slow camera drift (zoom 1.00 → 1.04). No extra text.

### S10 · CTA + end card · Night → Mist · `vo_10_cta`
- Cue 0.00 (Night): `Mau tahu cara **pasangnya**?`
- Cue 2.17 (hard cut to Mist): `ProfileHeaderCard` for **niskalaworks.dev** slides up. The `Ikuti` button gets a tap at about 3.2 s and changes to `Mengikuti` (button state change, gray fill, 8 frames).
  Headline above it: `**Follow** dulu.`
- Cue 6.99: → headline `Tipsnya kita bagiin.`
- Cue 8.60: a `SafariUrlBar` slides in under the card showing `niskalaworks.dev` with a lock icon. Headline → `Kunjungi **niskalaworks.dev**`.
- End: the card and the URL bar settle; `Niskala Works` wordmark (v1 outro style) fades in below. Hold 45 frames after the VO ends.
- Handle text: `TODO_IG_HANDLE` default `niskalaworks.dev`. Logo: `TODO_LOGO` (placeholder until supplied).

**Budgets (report them):** black beats 2 (S2, S6) + S10 opening on Night; lebay 2 (NAIK, Segitu-segitu) + the STOP hook exception; zooms only at: S3 stack, S4 line tip, S8 tag pill, `Lihat di website`, URL bar, order total, notification.

---

## 5. UI component library (the main new work)

Build these as reusable components in their own folder (e.g. `src/reels/ui/ios/`). They are rendered in **phone points** (393 × 852, iPhone 15/16 size) and scaled into the world. Every component takes props for its content, so later reels can reuse them.

### 5.1 Realism standard (applies to all)

The bar: a screenshot of any single frame should be mistaken for a real iOS screen at first glance, except that there is no brand.

- **Font inside the phone:** Inter (closest open alternative to the iOS system font), with iOS text styles: Large Title 34/41 bold, Title3 20/25 semibold, Headline 17/22 semibold, Body 17/22 regular, Subheadline 15/20, Footnote 13/18, Caption 12/16. Use `font-feature-settings: "cv11", "ss01"` and slight negative tracking on large sizes. Headlines outside the phone stay Archivo (v1).
- **iOS colours:** system background `#FFFFFF`, secondary background `#F2F2F7`, label `#000000`, secondary label `rgba(60,60,67,0.6)`, separator `rgba(60,60,67,0.29)` at 0.5 pt, system blue `#007AFF`, system green `#34C759`. Store UI (tokokamu) uses the plum token for its own buttons.
- **Materials:** sheets, the browser toolbar and notifications use iOS frosted glass: `backdrop-filter: blur(30px) saturate(180%)` over `rgba(255,255,255,0.72)` (light). Test that it renders in Remotion's Chromium. If it doesn't, fake it with a blurred copy of the layer beneath, and report what you did.
- **Geometry:** continuous corners (use a squircle mask or `border-radius` with `corner-shape` fallback; at least avoid perfectly circular corners on large cards), sheet corner radius 38 pt, card radius 12 pt, button radius 12 pt (pills: full). 16 pt side margins. Hairline separators.
- **Icons:** draw line icons in SVG yourself, 1.5–2 pt stroke, SF Symbols-like proportions (heart, comment bubble, paper plane, bookmark, bag, lock, chevron, xmark, ellipsis, checkmark.circle.fill). **Do not copy** Instagram's or Apple's icon files.
- **Motion:** iOS springs. Sheets: `spring({ damping: 26, stiffness: 300, mass: 1 })`. Pushes: 0.35 s with a parallax (previous screen moves −30% and dims). Button press: scale 0.97 + 8% darker for 4 frames, then release. Every tap uses the v1 tap indicator (cream circle + ripple).
- **Alive details** (this is what makes it "live"): status bar time `9:41`, full battery, signal bars; the reel's progress bar keeps moving; product images have a very slow Ken Burns (scale 1.00 → 1.03); the browser shows a 6-frame skeleton shimmer before content; numbers in the checkout total roll in; the like heart can pulse once. Max 3 moving elements rule still applies, so these details must stay subtle.

### 5.2 Components

| Component | Spec |
|---|---|
| `PhoneShell` | Built in code, not an image: generic modern phone, 393 × 852 screen, about 55 pt screen corner radius, thin dark titanium-like bezel with a subtle highlight, Dynamic Island-style pill, home indicator. No logo, no buttons that read as a specific brand. Entrance: v1 `PhoneFrame` motion (rise + rotateY). Replaces `TODO_PHONE_RENDER` (keep the slot as an optional override). |
| `IosStatusBar` | 9:41, signal, wifi, battery. Light and dark variants (dark on `ReelScreen`). |
| `ProfileScreen` | Social-app profile for `tokokamu`: avatar (initials monogram, plum), name, bio line "Botol & tumbler · Kirim tiap hari", stats row (`Postingan` / `Pengikut` / `Mengikuti`, values `TODO_PROFILE_STATS` default `128 · 12,4 rb · 210`), `Ikuti` + `Kirim pesan` buttons, highlight circles, tab bar (grid / reels), 3-column grid of 9 tiles using the product photos (each on a solid card colour), reel tiles marked with a small play icon. Bottom tab bar with 5 generic line icons. |
| `ReelScreen` | **Instagram-like reel layout, not TikTok-like.** Full-bleed vertical video (`TODO_REEL_FOOTAGE`, no faces; fallback = the hero product on a soft dark-to-warm gradient set with slow Ken Burns and a subtle light sweep). Top: `Reels` title left, camera icon right. Dark gradient at the bottom. Right action rail, top to bottom: heart + count, comment + count, paper plane, bookmark, ellipsis, then a small rounded-square audio thumbnail (not a spinning disc). Bottom-left: account row (avatar, `tokokamu`, outlined `Ikuti`), one-line caption with `…selengkapnya`, audio row. Thin progress bar at the very bottom. |
| `ProductTagPill` | The "keranjang putih": white bag icon + tiny hero thumbnail + `Termos LED 500 ml` + `+3`, on a dark translucent frosted pill, bottom-left above the caption. States: hidden, pop-in, idle, pressed. |
| `ProductSheet` | **Dark** bottom sheet (matches the reel context and `mockup_02_sheet.png`): grab handle, title `Di reels ini`, 2 × 2 grid of cards. Card 1 = hero (`Termos LED 500 ml`, `tokokamu`, `Rp450.000`), cards 2–4 = silver / black / blue bottles (`Botol Steel 750 ml` `Rp480.000`, `Botol Hitam 1 L` `Rp520.000`, `Botol Biru 950 ml` `Rp590.000`; all `TODO_PRODUCT_NAMES` defaults). One price format everywhere: `Rp450.000` (no `,00`). Dims the reel behind to 40%. |
| `IgProductPage` | Light pushed page following `mockup_03_product_page.png`: nav bar (back chevron, `tokokamu`, bag + share icons), hero image card with page dots, name `Termos LED 500 ml`, price `Rp450.000`, rating row `4,8 · 128 ulasan`, `Warna` swatches (silver selected), `Ukuran` chips (`500 ml` selected, `750 ml`), full-width system-blue button **`Lihat di website`** + heart button. No emoji feature row. |
| `InAppBrowser` | Slides up from the bottom: top bar with xmark, lock icon + **`tokokamu.com`** (Footnote semibold) and a small gray subtitle `tokokamu.com` (no app name), ellipsis; thin blue progress bar under it; skeleton shimmer then content. |
| `StorePage` | The seller's own store, following `mockup_04_store_page.png` (but on iOS, inside `InAppBrowser`): announcement bar `GRATIS ONGKIR SE-INDONESIA` (plum), menu icon, centred wordmark `TOKOKAMU`, cart icon, hero image card, uppercase name `TERMOS LED - 500 ML`, price `Rp450.000`, one-line description `Termos stainless dengan layar suhu LED, tahan panas & dingin 24 jam.`, colour swatches, quantity stepper, outlined `Tambah ke keranjang`, solid plum **`Beli sekarang`**. |
| `CheckoutPage` | Following `mockup_05_checkout.png`: header `TOKOKAMU` + bag icon, `Ringkasan pesanan ⌄` row with hero thumbnail and **`Rp450.000`** (rolling digits), `Kontak` email field, checkbox `Kirimi saya info promo`, `Pengiriman` fields (`Negara/Wilayah: Indonesia`, `Nama depan`, `Nama belakang`, `Alamat`, `Kota`, `Provinsi ⌄`, `Kode pos`), solid plum `Bayar sekarang` button. Field styling: 1 pt border, 10 pt radius, 15 pt placeholder. |
| `SuccessScreen` | Following `mockup_06_payment_success.png`: green check in a soft glowing circle (draws on with `evolvePath`, 14 f), `Pembayaran berhasil`, `Detail transaksi` rows (`No. pesanan` `TKM-0001`, `Tanggal` `TODO_ORDER_DATE` default today's date formatted `3 Nov 2026, 19.00`, `Metode` `QRIS`), `Total dibayar` **`Rp450.000`**, dark `Kembali ke toko` button. |
| `IosNotification` | iOS banner: frosted rounded card, app icon slot (generic plum square with a bag glyph, no brand), title, body, `sekarang` time. Drops from the top with a spring, slight scale 0.96 → 1. Props: `title`, `body`. |
| `FollowerToast` | Small frosted pill with a person-plus icon and text. |
| `DmBubble` | Chat bubble (gray received style) with a tiny avatar, iOS Messages proportions. |
| `PromoBadge` | Realistic generic e-commerce promo badges for S3: `Flash sale` (lightning icon, countdown `02:14:09` ticking), `Diskon tanggal kembar` (ticket-shaped with perforated edge), `Gratis ongkir` (truck icon). Use neutral colours from tokens plus one warm orange `#FF7A1A`. **No marketplace colour schemes** (no Shopee orange-red gradient, no Tokopedia green, no TikTok cyan/pink). The `TODO_PROMO_*` asset slots remain as optional overrides. |
| `ProfileHeaderCard` | For S10: a floating card version of the profile header for **niskalaworks.dev** (avatar from `TODO_LOGO` or an `N` monogram, name `Niskala Works`, bio `TODO_NISKALA_BIO` default `Website buat toko online · tips jualan`), `Ikuti` button with the `Mengikuti` state. |
| `SafariUrlBar` | Floating frosted URL bar (iOS bottom-bar style): `aA`, lock, `niskalaworks.dev`, reload icon. |

### 5.3 Showcase composition

Build a dev-only composition `UiKitShowcase` (1080 × 1920) that shows every component and each of its states side by side on Mist, with a frame counter. I review realism there before it goes into the reel.

Also build `ReferenceCompare`: for each screen that has a reference mockup, show the mockup (left) and your coded component (right) at the same height. Render one still per pair. The coded version should feel as clean as the reference, while fixing everything listed as "do not copy" in section 00.

---

## 6. Stages

**Stage 1 — Study v1 (no new code).** Section 1: stills in `out/v1-reference/`, Keep / Change list, plus: Remotion version, installed `@remotion/*` packages, how fonts load, and whether `backdrop-filter` renders in this setup (make a 1-frame test). Stop.

**Stage 2 — Audio timing.** `calculateMetadata`, scene durations from VO, phrase cues, music ducking. Apply to the **existing** v1 scenes with the new copy (S1–S7), no new UI yet. Render the full MP4 so I can check the sync by ear. Report the total duration and every place where `wordGap` was shortened or a hold fell below 15 frames. Stop.

**Stage 3 — UI kit.** Section 5 components + `UiKitShowcase` + `ReferenceCompare`. Render stills of the showcase (each component, each state) and every compare pair at 2× scale. Stop.

**Stage 4 — S7b–S10.** Put the kit into the reel. Stills at the middle of S7b, each S8 beat, S9 and S10, plus the full MP4. Stop.

**Stage 5 — Polish and render.**
```
npx remotion render Reel01 out/reel01-v2-stop.mp4 --props='{"hookVariant":"stop"}' --codec=h264 --crf=18 --x264-preset=veryfast
```
Plus `hookVariant: "plain"` if `TODO_VO_HOOK_PLAIN` exists. Report: render time, dev-check results, budgets, every TODO left, and a side-by-side still comparison of v1 vs v2 for S1–S6 to prove they did not drift.

---

## 7. QA checklist (Stage 5 report)

- [ ] S1–S6 look the same as v1 (only copy, timing and STOP changed).
- [ ] Text never lags the voice; every line starts on or up to 3 frames before its cue.
- [ ] `NAIK` lands on the word "naik"; `Segitu-segitu` lands on "segitu".
- [ ] No sentence cropped; dev check clean.
- [ ] No Instagram logo, wordmark, gradient or the name inside any UI; no Apple, marketplace or courier branding anywhere.
- [ ] Any single frame of the phone UI could pass as a real iOS screenshot (minus brand).
- [ ] The same phone shell and the same hero product (`Termos LED 500 ml`, `Rp450.000`) appear from S7b to the end of S8.
- [ ] No reference mockup image appears anywhere in the rendered video.
- [ ] All UI text is Indonesian; one price format (`Rp450.000`) everywhere.
- [ ] The URL bar zoom in 8c is held until the VO line "punya website sendiri" ends.
- [ ] Music is ducked under every VO line.
- [ ] Reel is still understandable with sound off.
- [ ] Total duration reported (expected about 70 s).

## 8. Open TODOs (don't guess)

- `TODO_REEL_FOOTAGE`: optional real b-roll of the bottle (no faces, no real brand). Until then use the coded fallback from `ReelScreen`.
- `TODO_PRODUCT_NAMES`, `TODO_LED_READOUT`, `TODO_ORDER_DATE`: defaults given above; keep them as constants.
- `TODO_LOGO`, `TODO_IG_HANDLE` (default `niskalaworks.dev`), `TODO_NISKALA_BIO`.
- `TODO_PROFILE_STATS` for the tokokamu profile.
- `TODO_MUSIC` and SFX files.
- `TODO_VO_HOOK_PLAIN` (optional plain-hook VO for testing).
