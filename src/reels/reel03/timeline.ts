import { REEL } from "../tokens";

/**
 * Reel03 (Mora Jaya showcase), storyboard of 2026-11-15. 140 BPM, 59 beats = 25.3 s (the customer/admin divider was dropped; separation is a subtle phone tint).
 * Every cut sits on a beat (or half beat), rounded to the nearest frame.
 * scripts/audio/reel03_audio.py mirrors the beat numbers below; change both together.
 */
export const FPS = REEL.fps;
export const BPM = 140;
/** Frame of a beat number (fractions allowed). */
export const B = (beat: number): number => Math.round((beat * FPS * 60) / BPM);

export const TOTAL_BEATS = 59;
export const TOTAL_FRAMES = B(TOTAL_BEATS);

export type Bg = "night" | "paper" | "accent" | "black";
export type SceneId = "this" | "enter" | "home" | "pdp" | "carousel" | "cart" | "orders" | "inbox" | "status" | "done" | "crm" | "promo" | "report" | "logo" | "end";

/** Hard cuts, alternating dark / light / accent. `to` is the next scene's `from`. */
export const SCENES: readonly { id: SceneId; from: number; bg: Bg }[] = [
  { id: "this", from: B(0), bg: "night" },
  { id: "enter", from: B(4), bg: "accent" },
  { id: "home", from: B(5.5), bg: "paper" },
  { id: "pdp", from: B(8.5), bg: "night" },
  { id: "carousel", from: B(11.5), bg: "accent" },
  { id: "cart", from: B(15), bg: "night" },
  { id: "orders", from: B(19), bg: "paper" },
  { id: "inbox", from: B(21), bg: "paper" },
  { id: "status", from: B(24), bg: "night" },
  { id: "done", from: B(28), bg: "accent" },
  { id: "crm", from: B(31.5), bg: "night" },
  { id: "promo", from: B(35.5), bg: "accent" },
  { id: "report", from: B(39.5), bg: "night" },
  { id: "logo", from: B(43), bg: "paper" },
  { id: "end", from: B(50), bg: "black" },
];
export const sceneRange = (id: SceneId): [number, number] => {
  const i = SCENES.findIndex((s) => s.id === id);
  return [SCENES[i].from, i + 1 < SCENES.length ? SCENES[i + 1].from : TOTAL_FRAMES];
};
export const sceneAt = (frame: number): { id: SceneId; bg: Bg; from: number; to: number; t: number } => {
  let i = 0;
  SCENES.forEach((s, k) => {
    if (frame >= s.from) i = k;
  });
  const from = SCENES[i].from;
  const to = i + 1 < SCENES.length ? SCENES[i + 1].from : TOTAL_FRAMES;
  return { id: SCENES[i].id, bg: SCENES[i].bg, from, to, t: (frame - from) / Math.max(1, to - from) };
};

/** Hook hits: "This." b0, "Is how." b1, "Niskala." b2, "Works." b3 (2.3 hits a second, under the 3 cap). */
export const HITS = [B(0), B(1), B(2), B(3)] as const;

export type ScreenId =
  | "01-beranda"
  | "02-detail-produk"
  | "03-detail-produk-sering-dibeli"
  | "04-keranjang"
  | "06-data-diri"
  | "05-pesanan-terkirim"
  | "07-admin-pesanan"
  | "08-admin-pesanan-diproses"
  | "09-admin-detail-pesanan"
  | "10-admin-konfirmasi-selesai"
  | "13-admin-laporan"
  | "11-admin-pelanggan"
  | "14-admin-promo";
export const ALL_SCREENS: readonly ScreenId[] = [
  "01-beranda",
  "02-detail-produk",
  "03-detail-produk-sering-dibeli",
  "04-keranjang",
  "06-data-diri",
  "05-pesanan-terkirim",
  "07-admin-pesanan",
  "08-admin-pesanan-diproses",
  "09-admin-detail-pesanan",
  "10-admin-konfirmasi-selesai",
  "13-admin-laporan",
  "11-admin-pelanggan",
  "14-admin-promo",
];

/** What is on the phone's glass, from which frame (slides in over 5 frames). */
export const SCREENS: readonly { id: ScreenId; from: number }[] = [
  { id: "01-beranda", from: B(4) },
  { id: "02-detail-produk", from: B(8.5) },
  { id: "03-detail-produk-sering-dibeli", from: B(11.5) },
  { id: "04-keranjang", from: B(15) },
  { id: "06-data-diri", from: B(17) },
  { id: "05-pesanan-terkirim", from: B(19) },
  { id: "07-admin-pesanan", from: B(21) },
  { id: "08-admin-pesanan-diproses", from: B(24) },
  { id: "09-admin-detail-pesanan", from: B(26) },
  { id: "10-admin-konfirmasi-selesai", from: B(28) },
  { id: "11-admin-pelanggan", from: B(31.5) },
  { id: "14-admin-promo", from: B(35.5) },
  { id: "13-admin-laporan", from: B(39.5) },
];
export const SLIDE_FRAMES = 5;
/** "Sering dibeli bersama" row of screen 03: source-pixel band that scrolls sideways. */
export const CAROUSEL = { screen: "03-detail-produk-sering-dibeli", y0: 1060, y1: 1985, from: B(12), to: B(14), shift: 70 } as const;

/** The phone is ~80% of the frame height: 690 x 1493 screen, 738 x 1541 with the bezel. */
export const SCREEN = { width: 690, height: 1493 } as const;
export const K = SCREEN.width / 1170;

/** Taps, in source pixels, at the frame the finger lands. */
export const TAPS = [
  { frame: B(16.4), x: 585, y: 2316 }, // Lanjut isi data diri
  { frame: B(17.9), x: 585, y: 2310 }, // Kirim pesanan lewat WhatsApp
  { frame: B(23.1), x: 879, y: 2200 }, // Terima (admin Pesanan)
  { frame: B(25.5), x: 791, y: 640 }, // Siap diambil (daftar Diproses)
  { frame: B(27.7), x: 807, y: 2140 }, // Siap diambil (detail pesanan)
  { frame: B(29.6), x: 805, y: 2411 }, // Ya, selesai (konfirmasi)
  { frame: B(33.6), x: 582, y: 2152 }, // Chat WhatsApp (Pelanggan)
  { frame: B(41.6), x: 900, y: 260 }, // Unduh Excel (Laporan)
] as const;

/** Pieces of the real screen that lift off the glass. Boxes are in screenshot pixels. */
export type FloatCard = {
  screen: ScreenId;
  from: number;
  to: number;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  ox: number;
  oy: number;
  z: number;
  rot: number;
  dim?: boolean;
};
export const CARDS: readonly FloatCard[] = [
  { screen: "01-beranda", from: B(5.8), to: B(7.6), x: 48, y: 921, w: 1074, h: 444, r: 30, ox: -36, oy: -70, z: 150, rot: -3 }, // Flash Sale banner
  { screen: "06-data-diri", from: B(17.5), to: B(18.8), x: 48, y: 2226, w: 1074, h: 168, r: 40, ox: 0, oy: -160, z: 160, rot: 2 }, // Kirim pesanan lewat WhatsApp
  { screen: "07-admin-pesanan", from: B(21.3), to: B(22.4), x: 48, y: 740, w: 1074, h: 305, r: 30, ox: 0, oy: -90, z: 160, rot: -2 }, // Baru / Diproses / Diantar
  { screen: "08-admin-pesanan-diproses", from: B(24.2), to: B(25.3), x: 48, y: 170, w: 1074, h: 600, r: 30, ox: -50, oy: -60, z: 160, rot: 3 }, // kartu pesanan Diproses
  { screen: "09-admin-detail-pesanan", from: B(26.2), to: B(27.5), x: 48, y: 385, w: 1074, h: 545, r: 30, ox: 50, oy: -70, z: 170, rot: -3 }, // stepper status
  { screen: "11-admin-pelanggan", from: B(31.9), to: B(33.1), x: 48, y: 505, w: 1074, h: 300, r: 30, ox: -40, oy: -90, z: 160, rot: 2 }, // Pembeli / Pelanggan ulang
  { screen: "14-admin-promo", from: B(35.9), to: B(37.9), x: 48, y: 1510, w: 1074, h: 690, r: 30, ox: 40, oy: -60, z: 160, rot: -2 }, // kartu Flash Sale
  { screen: "13-admin-laporan", from: B(39.9), to: B(41.1), x: 48, y: 190, w: 1074, h: 330, r: 30, ox: 0, oy: -50, z: 150, rot: 1 }, // Hari ini / 7 hari / 30 hari + Unduh Excel
];


/** SFX cues: file, frame, gain. */
export const SFX: readonly { id: string; frame: number; gain: number }[] = [
  { id: "hit1", frame: B(0), gain: 1 },
  { id: "hit2", frame: B(1), gain: 1 },
  { id: "hit3", frame: B(2), gain: 1 },
  { id: "hit4", frame: B(3), gain: 1 },
  { id: "whoosh", frame: B(4), gain: 0.7 }, // the phone sweeps in
  { id: "whoosh_soft", frame: B(5.5), gain: 0.5 },
  { id: "whoosh_soft", frame: B(8.5), gain: 0.5 },
  { id: "whoosh_soft", frame: B(11.5), gain: 0.5 },
  { id: "whoosh_soft", frame: B(15), gain: 0.5 },
  ...TAPS.map((tap) => ({ id: "tap", frame: tap.frame, gain: 0.9 })),
  { id: "whoosh_soft", frame: B(17), gain: 0.5 },
  { id: "chime", frame: B(19), gain: 0.8 },
  { id: "whoosh", frame: B(19), gain: 0.6 },
  { id: "notif", frame: B(19.4), gain: 1 },
  { id: "whoosh_soft", frame: B(21), gain: 0.5 },
  { id: "whoosh_soft", frame: B(24), gain: 0.5 },
  { id: "whoosh_soft", frame: B(26), gain: 0.5 },
  { id: "whoosh", frame: B(28), gain: 0.6 },
  { id: "whoosh", frame: B(31.5), gain: 0.6 },
  { id: "whoosh", frame: B(35.5), gain: 0.6 },
  { id: "whoosh", frame: B(39.5), gain: 0.6 },
  { id: "whoosh", frame: B(43), gain: 0.6 },
  { id: "pop", frame: B(44), gain: 0.8 },
  { id: "tap", frame: B(47.5), gain: 0.9 },
  { id: "pop", frame: B(47.7), gain: 0.7 },
];
