/**
 * On-screen copy, verbatim from the VO (it says "dapet", so the screen does too).
 * `at` is each word's start in seconds from the start of the single VO file,
 * from data/reels/20261113-pov-rame-tapi-tipis/transcript.json (VO v2: the pengunjung line
 * re-recorded and spliced in at 10.5 s). Whisper's "tokok" / "otak hati" are "toko" / "otak-atik".
 */
type Line = { lines: readonly string[]; at: readonly number[] };

export const HOOK: Line = {
  lines: ["**POV:** ~~toko kamu~~", "__rame tiap hari__"],
  /* Whisper puts "POV" at 0.00; the voice starts a beat later. */
  at: [0.1, 1.1, 1.4, 1.74, 2.14, 2.48],
};

export const DROP: Line[] = [{ lines: ["~~tapi~~ **uangnya**", "**nggak ada.**"], at: [3.16, 3.5, 3.9, 4.06] }];

export const IKLAN: Line[] = [
  { lines: ["~~Iklan bilang~~", "~~jualan kamu~~", "**laku keras**."], at: [5.02, 5.4, 5.68, 6.14, 6.38, 6.6] },
  { lines: ["~~Tapi pas dicek~~", "__saldo__,"], at: [7.4, 7.92, 8.16, 8.44] },
  { lines: ["~~angkanya~~", "**nggak segitu**."], at: [9.22, 9.5, 9.68] },
];

export const SEPI: Line[] = [
  {
    lines: ["~~Terus,~~ __pengunjung__", "__toko kamu__ ~~bisa~~", "**turun** ~~kapan aja.~~"],
    at: [10.52, 11.32, 11.58, 11.88, 12.2, 12.42, 12.72, 12.96],
  },
  { lines: ["~~Yang tadinya~~ __rame__,", "~~tiba-tiba~~ **sepi**."], at: [13.92, 14.1, 14.4, 15.16, 15.52] },
  { lines: ["~~Padahal kamu~~", "~~nggak~~ __otak-atik__", "~~apa-apa.~~"], at: [16.44, 16.84, 17.08, 17.22, 17.68] },
];

/* "Terus," was cut from the start of this line in the VO edit, so it doesn't follow another "Terus,". */
export const GIGIT: Line[] = [
  { lines: ["__Tiap seratus ribu__", "~~yang masuk,~~"], at: [18.72, 19.02, 19.18, 19.64, 19.8] },
  { lines: ["~~hampir~~", "**separuhnya** ~~udah~~", "**digigit** ~~duluan.~~"], at: [20.56, 20.9, 21.46, 21.6, 21.98] },
  { lines: ["~~Buat~~ __admin.__"], at: [22.88, 23.12] },
  { lines: ["~~Buat~~ __iklan.__"], at: [24.08, 24.22] },
];

export const TULANG: Line[] = [
  { lines: ["~~Platform dapet~~", "__dagingnya__,"], at: [25.26, 25.68, 26.02] },
  { lines: ["~~kamu cuma dapet~~", "**tulangnya**."], at: [26.88, 27.2, 27.44, 27.72] },
];

export const TEASER: Line[] = [
  { lines: ["~~Semua ini~~", "__bukan kamu__", "~~yang atur,~~"], at: [28.24, 29.0, 29.22, 29.48, 29.9, 30.08] },
  {
    lines: ["~~tapi ada~~ __satu hal__", "~~yang masih bisa~~", "~~kamu~~ **kontrol**."],
    at: [30.68, 31.2, 31.68, 32.12, 32.44, 32.6, 33.04, 33.3, 33.54],
  },
];

export const CTA: Line[] = [
  { lines: ["~~Kita bahas di~~", "__video berikutnya__."], at: [34.36, 34.6, 34.98, 35.14, 35.42] },
  { lines: ["**Follow** __Niskala__", "~~biar nggak~~", "~~ketinggalan.~~"], at: [36.28, 36.54, 37.02, 37.38, 37.52] },
];

/** Moments the visuals hit, in VO seconds. */
export const BEATS = {
  adCard: 5.0,
  saldoCard: 8.3,
  saldoLand: 9.6,
  dashboardIn: 10.6,
  zoomDrop: 15.45,
  cardIn: 18.7,
  digigit: 21.6,
  biteAdmin: 23.05,
  biteIklan: 24.15,
  meatIn: 25.15,
  meatTaken: 26.8,
  boneLeft: 27.72,
  pushIn: 30.6,
  followCard: 36.15,
  tap: 37.0,
} as const;
