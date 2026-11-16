/**
 * Golden spec: Reel01, the style reference. Generated once from the original
 * copy.ts and the strings embedded in the scene components; the test
 * scripts/test-reel01-spec.ts proves it renders the same markup as the original.
 * Agents copy this shape, they do not change the style.
 */
import { accent, CONTRACT_VERSION, plain, quiet, ReelSpec, strong } from "../../contract/spec.schema.ts";

export const spec = {
  contractVersion: CONTRACT_VERSION,
  preset: "reel01-pov-v1",
  id: "reel01",
  hookVariant: "stop",
  hook: {
    stop: "STOP.",
    question: [[quiet("Kamu jualan")], [quiet("di"), strong("marketplace?")]],
    hook: [[quiet("Jangan biarin")], [strong("toko kamu")], [accent("mati"), quiet("di"), strong("2027.")]],
  },
  numpang: {
    line: [[strong("Toko kamu")], [quiet("cuma"), accent("numpang")], [quiet("di platform orang.")]],
  },
  reasons: {
    promo: {
      question: [[quiet("Gak ikut"), strong("promo?")]],
      answer: [[accent("Tenggelam.")]],
    },
    biaya: {
      label: [[strong("Biaya iklan")]],
      punch: "NAIK",
      tail: [[quiet("terus.")]],
    },
    omzet: {
      label: [[strong("Omzet?")]],
      squash: ["Segitu-", "segitu"],
      tail: [[quiet("aja.")]],
    },
  },
  blackBeat: {
    phrase: [[quiet("Kamu yang capek")], [strong("kerja,")], [quiet("platform yang"), accent("untung"), plain(".")]],
  },
  solution: {
    first: [[quiet("Tapi bukan berarti")], [quiet("kamu harus"), strong("tutup toko.")]],
    second: [[quiet("Cukup buka")], [accent("jalur jualan")], [strong("sendiri.")]],
  },
  phone: {
    bridge: [[[quiet("Mulai dari yang")], [quiet("paling dekat,")]], [[strong("Instagram"), quiet("kamu.")]]],
    reveal: [
      [[quiet("Soalnya banyak seller")], [quiet("belum tahu,")]],
      [[quiet("Reels kamu bisa")], [quiet("dipasang")]],
      [[accent("keranjang putih"), plain(".")]],
    ],
    tap: [
      [[quiet("Sekali"), strong("tap,")]],
      [[quiet("pembeli langsung masuk")], [quiet("ke"), accent("website kamu"), plain(".")]],
    ],
    syarat: [[[strong("Syarat utamanya:")]], [[quiet("punya")], [accent("website sendiri"), plain(".")]]],
    checkout: [
      [[quiet("Checkout di")], [strong("toko kamu sendiri,")]],
      [[accent("Tanpa potongan")], [quiet("marketplace.")]],
    ],
    resolusi: [
      [[strong("Marketplace")], [quiet("tetap jalan,")]],
      [
        [quiet("tapi"), strong("Instagram"), quiet("bisa")],
        [quiet("bawa"), accent("pembeli baru")],
      ],
      [[quiet("yang langsung belanja")], [quiet("di"), strong("toko kamu.")]],
    ],
  },
  cta: {
    phrases: [
      [[quiet("Mau tau tips")], [accent("jualan online"), plain("?")]],
      [[accent("Follow"), quiet("kita")], [quiet("di Instagram,")]],
      [[accent("niskalaworks.dev")]],
      [[quiet("Dan kunjungi")], [quiet("website kita")]],
      [[quiet("di")], [accent("niskalaworks.dev")]],
    ],
  },
} satisfies ReelSpec;
