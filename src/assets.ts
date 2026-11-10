import { staticFile } from "remotion";

/**
 * Single manifest of every public/assets/* file used by the chunk-one
 * series. Components import from here, never a raw path string — swapping a
 * finished asset in later means overwriting the file at this exact path, no
 * code change required anywhere.
 */
export const ICONS = {
  cart: staticFile("assets/icons/cart.svg"),
  browser: staticFile("assets/icons/browser.svg"),
  growthChart: staticFile("assets/icons/growth_chart.svg"),
  shoppingBag: staticFile("assets/icons/shopping_bag.svg"),
  peopleGroup: staticFile("assets/icons/people_group.svg"),
  clipboard: staticFile("assets/icons/clipboard.svg"),
  package: staticFile("assets/icons/package.svg"),
  mapPin: staticFile("assets/icons/map-pin.svg"),
  truck: staticFile("assets/icons/truck.svg"),
  chartLineUp: staticFile("assets/icons/chart-line-up.svg"),
} as const;

export const LOGOS = {
  /** Just the Niskala mark (the "gate" in Beat2Migration). */
  niskalaMark: staticFile("assets/logos/niskala-mark.svg"),
  /** Full mark + wordmark lockup (the Beat6Outcome sign-off). */
  niskalaLogo: staticFile("assets/logos/niskala-logo.svg"),
} as const;

export const MOCKUPS = {
  storefront: staticFile("assets/mockups/storefront-placeholder.png"),
  dashboard: staticFile("assets/mockups/dashboard-placeholder.png"),
} as const;

/** Real product photos (from the basic-package folder's Unsplash bag shots,
 *  downscaled) used as the product images in StorefrontMock. */
export const PRODUCT_PHOTOS = {
  bagWoven: staticFile("assets/mockups/bag-woven.jpg"),
  bagSatchel: staticFile("assets/mockups/bag-satchel.jpg"),
  bagSling: staticFile("assets/mockups/bag-sling.jpg"),
} as const;

/**
 * NiskalaStory mockups. Phone PNGs are 3x (393x852 logical), laptop PNGs
 * are 2x (1210x756 logical). `flat` is the bare screen; `framed` is the same
 * screen already in an iPhone/MacBook frame (visual reference + fallback).
 */
const STORY_MOCKUP_DIR = "assets/niskala-toko-anda-mockups";

export const STORY_SCREENS = [
  "01-packaging-insert",
  "02-first-visit-home",
  "03-storefront-home",
  "04-cart",
  "05-checkout",
  "06-order-success",
  "07-admin-orders",
  "08-admin-order-detail",
  "09-admin-customers",
  "10-admin-revenue",
  "11-wa-confirmation",
  "12-tracking",
  "13-review",
  "14-repeat-order",
  "15-revenue-growth",
] as const;

export type StoryScreen = (typeof STORY_SCREENS)[number];

export const storyFlat = (screen: StoryScreen) => staticFile(`${STORY_MOCKUP_DIR}/flat/${screen}.png`);
export const storyFramed = (screen: StoryScreen) => staticFile(`${STORY_MOCKUP_DIR}/framed/${screen}.png`);

/** Act 0 "pain" screens: a generic marketplace seller center ("Pusat
 *  Penjual"). Same scales as the story mockups — laptop JPGs 2x, the phone
 *  JPG 3x; the suspend notification is a 1179x300 transparent PNG (3x). */
export const STORY_PAIN = {
  dashboardStatistik: staticFile(`${STORY_MOCKUP_DIR}/flat/dashboard-statistik.jpg`),
  pelangganDisamarkan: staticFile(`${STORY_MOCKUP_DIR}/flat/pelanggan-disamarkan.jpg`),
  kontakKosong: staticFile(`${STORY_MOCKUP_DIR}/flat/kontak-kosong.jpg`),
  notifikasiSuspend: staticFile(`${STORY_MOCKUP_DIR}/flat/notifikasi-suspend.png`),
} as const;
