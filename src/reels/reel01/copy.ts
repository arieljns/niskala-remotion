/**
 * On-screen copy, verbatim from the VO. `at` holds each word's start in seconds
 * from the start of its VO file: a line's first word sits on its cue, the rest
 * come from a transcript of the file. One entry per word.
 */
type Line = { lines: readonly string[]; at: readonly number[] };

/** S1-S7 lay their text out themselves, so only the timing lives here. */
export const WORD_TIMES = {
  s1Question: [0.88, 1.16, 1.46, 1.62],
  s1Hook: [2.63, 3.08, 3.42, 3.72, 3.96, 4.42, 4.64],
  s3Question: [0.05, 0.22, 0.46],
  s4Biaya: [0.05, 0.42],
  s4Terus: 1.5,
  s5Aja: 1.6,
  s7Bukan: [0.05, 0.46, 0.8, 1.14, 1.4, 1.74, 2.12],
  s7Buka: [2.83, 3.2, 3.46, 3.84, 4.24],
} as const;

/**
 * Starts on the reveal at 2.10 s, ahead of the voice's "toko" at 2.76 s: "selama ini"
 * isn't on screen, and it has to hold before the line ends.
 */
export const S2_LINE = {
  lines: ["__Toko kamu__", "~~cuma~~ **numpang**", "~~di platform orang.~~"],
  at: [2.1, 2.6, 2.95, 3.3, 3.7, 3.9, 4.15],
} as const;

export const BLACK_BEATS = {
  s6: [
    {
      lines: ["~~Kamu yang capek~~", "__kerja,__", "~~platform yang~~ **untung**."],
      at: [0.05, 0.48, 0.6, 0.96, 1.59, 2.06, 2.24],
    },
  ],
} as const;

export const LINES = {
  s7b: [
    { lines: ["~~Mulai dari yang~~", "~~paling dekat,~~"], at: [0.05, 0.38, 0.56, 0.78, 1.04] },
    { lines: ["__Instagram__ ~~kamu.~~"], at: [1.65, 2.2] },
  ],
  s8a: [
    { lines: ["~~Soalnya banyak seller~~", "~~belum tahu,~~"], at: [0.05, 0.7, 1.12, 1.44, 1.74] },
    { lines: ["~~Reels kamu bisa~~", "~~dipasang~~"], at: [2.25, 2.64, 2.92, 3.18] },
    { lines: ["**keranjang putih**."], at: [3.64, 4.04] },
  ],
  s8b: [
    { lines: ["~~Sekali~~ __tap,__"], at: [0.05, 0.5] },
    { lines: ["~~pembeli langsung masuk~~", "~~ke~~ **website kamu**."], at: [0.94, 1.38, 1.78, 2.06, 2.2, 2.48] },
  ],
  s8c: [
    { lines: ["__Syarat utamanya:__"], at: [0.05, 0.36] },
    { lines: ["~~punya~~", "**website sendiri**."], at: [1.14, 1.46, 1.78] },
  ],
  s8d: [
    { lines: ["~~Checkout di~~", "__toko kamu sendiri,__"], at: [0.05, 0.56, 0.7, 0.94, 1.12] },
    { lines: ["**Tanpa potongan**", "~~marketplace.~~"], at: [1.78, 2.22, 2.58] },
  ],
  s9: [
    { lines: ["__Marketplace__", "~~tetap jalan,~~"], at: [0.05, 0.64, 0.94] },
    { lines: ["~~tapi~~ __Instagram__ ~~bisa~~", "~~bawa~~ **pembeli baru**"], at: [1.65, 2.14, 2.72, 3, 3.22, 3.64] },
    { lines: ["~~yang langsung belanja~~", "~~di~~ __toko kamu.__"], at: [4.14, 4.42, 4.88, 5.18, 5.34, 5.58] },
  ],
  s10: [
    /* The user's chosen wording; the voice says "tips-tips berjualan". */
    { lines: ["~~Mau tau tips~~", "**jualan online**?"], at: [0.05, 0.26, 0.5, 0.98, 1.54] },
    { lines: ["**Follow** ~~kita~~", "~~di Instagram,~~"], at: [2.17, 2.5, 2.74, 2.94] },
    { lines: ["**niskalaworks.dev**"], at: [3.58] },
    { lines: ["~~Dan kunjungi~~", "~~website kita~~"], at: [5.24, 5.52, 5.96, 6.24] },
    { lines: ["~~di~~", "**niskalaworks.dev**"], at: [6.68, 6.98] },
  ],
} as const satisfies Record<string, readonly Line[]>;
