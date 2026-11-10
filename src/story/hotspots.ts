import type { HotspotRect } from "./components/Highlight";

/**
 * Every overlay coordinate measured from the mockup PNGs, in each screen's
 * logical units: phones 393x852 (PNG px / 3), laptops 1210x756 (PNG px / 2).
 * Measured by pixel-scanning the flat PNGs, not by eye.
 */

/** flat/dashboard-statistik.jpg — the red "Kunjungan −58%" KPI card
 *  (border at PNG px 420–1079 × 262–813). */
export const VISITS_CARD_PAIN: HotspotRect = { x: 210, y: 131, width: 329.5, height: 275.5, radius: 12 };

/** flat/pelanggan-disamarkan.jpg — the masked contact column: six "+62 8** ****"
 *  numbers, hidden addresses and "Disamarkan" chips (PNG px 751–1129 × 997–2385). */
export const MASKED_COLUMN_PAIN: HotspotRect = { x: 250.3, y: 332.3, width: 126, height: 462.7, radius: 10 };

/** flat/kontak-kosong.jpg — the big "0" and its "kontak pelanggan" label
 *  (zero at PNG px 1272–1559 × 462–802, label 1140–1672 × 890–930). */
export const ZERO_CONTACTS_PAIN: HotspotRect = { x: 566, y: 222, width: 274, height: 246, radius: 18 };

/** flat/01-packaging-insert.png — the QR code on the thank-you card
 *  (PNG px 193–461 × 1332–1600; the card is rotated ~2°, so this is the box). */
export const QR_01: HotspotRect = { x: 64.3, y: 444, width: 89.3, height: 89.3, radius: 2 };

/** flat/02-first-visit-home.png — the "Halo, Kak Rika! Kode SETIA5…" banner
 *  (PNG px 60–1118 × 342–527). */
export const SETIA5_BANNER_02: HotspotRect = { x: 20, y: 114, width: 353, height: 62, radius: 14 };

/** flat/03-storefront-home.png — the "Harga langsung dari toko, tanpa potongan
 *  platform" pill above the hero headline (PNG px 108–809 × 278–331). */
export const DIRECT_PRICE_BADGE_03: HotspotRect = { x: 54, y: 139, width: 350.5, height: 26.5, radius: 13 };

/** flat/04-cart.png — the "Potongan platform … Rp0" row in the summary card
 *  (text at PNG px 114–1064 × 1736–1776, padded to the card's inner width). */
export const PLATFORM_FEE_ROW_04: HotspotRect = { x: 33, y: 573, width: 327, height: 25, radius: 6 };

/** flat/07-admin-orders.png — orders table body. Rows are 48pt tall
 *  (separator lines every 96 PNG px from y=818); rows 1–2 are the two "Baru"
 *  orders, rows 3–7 the older ones. Card spans PNG px 522–2353. */
export const ORDERS_TABLE_07 = { x: 261, width: 915.5, firstRowY: 409, rowHeight: 48, rows: 7 } as const;

/** flat/08-admin-order-detail.png — tracking timeline. Check circles at PNG px
 *  x 1538–1589, y 500–551 then every 110 px; current (sienna) dot at
 *  1554–1575 × 956–977; connector line 3 PNG px wide at x≈1563. */
export const TIMELINE_08 = {
  x: 781.75,
  checkYs: [262.75, 317.75, 372.75, 427.75],
  checkRadius: 12.75,
  dotY: 483.25,
  dotRadius: 5.5,
  lineWidth: 1.5,
} as const;

/** flat/08-admin-order-detail.png — "Update status otomatis terkirim ke WhatsApp
 *  Rika · 3 pesan" box (PNG px 1538–2309 × 1138–1257). */
export const WA_UPDATES_08: HotspotRect = { x: 769, y: 569, width: 385.5, height: 59.5, radius: 15 };

/** flat/09-admin-customers.png — WHATSAPP column, header + six full numbers
 *  (header PNG px 975–1111 × 767–783, numbers 976–1178 × 858–1377). */
export const WA_COLUMN_09: HotspotRect = { x: 480, y: 375, width: 117, height: 322, radius: 10 };

/** flat/09-admin-customers.png — ORDER column (repeat purchases per saved
 *  contact), header + six counts (text PNG px 1275–1357 × 767–1379). */
export const ORDER_COLUMN_09: HotspotRect = { x: 627, y: 375, width: 62, height: 322, radius: 10 };

/** flat/10-admin-revenue.png — "Pendapatan harian" chart. Line traced from the
 *  sienna pixels at the 30 daily x positions (PNG px 648–1676). Gridlines at
 *  1,2 / 0,9 / 0,6 / 0,3 / 0 jt (PNG px y 772, 924, 1076, 1228, 1380). */
export const REVENUE_CHART_10 = {
  plot: { left: 320, right: 845, top: 380, baseline: 690 },
  gridYs: [386, 462, 538, 614],
  points: [
    [324.0, 601.0], [341.5, 593.0], [359.5, 601.0], [377.0, 578.5], [395.0, 568.0], [412.5, 554.5],
    [430.5, 555.0], [448.0, 581.5], [466.0, 579.5], [483.5, 551.2], [501.0, 538.0], [519.0, 549.2],
    [536.5, 529.8], [554.5, 516.2], [572.0, 522.0], [590.0, 517.5], [607.5, 524.2], [625.5, 525.5],
    [643.0, 524.8], [661.0, 495.5], [678.5, 486.2], [696.0, 513.0], [714.0, 514.2], [731.5, 478.2],
    [749.5, 495.5], [767.0, 486.8], [785.0, 461.0], [802.5, 461.8], [820.5, 475.2], [835.0, 472.5],
  ] as [number, number][],
} as const;
