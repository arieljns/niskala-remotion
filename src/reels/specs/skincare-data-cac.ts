import { accent, CONTRACT_VERSION, plain, quiet, ReelSpec, strong } from "../contract/spec.schema.ts";

export const spec = {
  contractVersion: CONTRACT_VERSION,
  preset: "reel01-pov-v1",
  id: "skincare-data-cac",
  hookVariant: "stop",
  hook: {
    stop: "STOP.",
    question: [[quiet("Kamu jualan")], [quiet("di"), strong("marketplace?")]],
    hook: [
      [strong("9 Miliar,")],
      [quiet("tapi masih")],
      [accent("bayar iklan.")],
    ],
  },
  numpang: {
    line: [
      [strong("Toko kamu")],
      [quiet("cuma"), accent("numpang")],
      [quiet("di platform orang.")],
    ],
  },
  reasons: {
    promo: {
      question: [[quiet("Gak punya"), strong("data?")]],
      answer: [[accent("Hilang.")]],
    },
    biaya: {
      label: [[strong("Biaya iklan")]],
      punch: "NAIK",
      tail: [[quiet("terus.")]],
    },
    omzet: {
      label: [[strong("Habis 30 hari?")]],
      squash: ["Beli-", "lagi"],
      tail: [[quiet("aja.")]],
    },
  },
  blackBeat: {
    phrase: [
      [quiet("Kamu yang")],
      [strong("capek,")],
      [quiet("platform ambil"), accent("data"), plain(".")],
    ],
  },
  solution: {
    first: [[quiet("Marketplace tetap jalan,")], [quiet("tapi buka"), strong("jalur sendiri.")]],
    second: [[quiet("Biar data pembeli")], [accent("tersimpan aman"), plain(".")]],
  },
  phone: {
    bridge: [
      [[quiet("Mulai dari yang")], [quiet("paling dekat,")]],
      [[strong("website"), quiet("kamu.")]],
    ],
    reveal: [
      [[quiet("Produk skincare habis")], [quiet("tiap bulan,")]],
      [[quiet("kamu bisa kontak")], [quiet("lewat sini")]],
      [[accent("WhatsApp sendiri"), plain(".")]],
    ],
    tap: [
      [[quiet("Sekali"), strong("tap,")]],
      [
        [quiet("pembeli langsung")],
        [quiet("ke"), accent("website"), plain(".")],
      ],
    ],
    syarat: [
      [[strong("Syarat paling utama:")]],
      [[quiet("punya")], [accent("website sendiri"), plain(".")]],
    ],
    checkout: [
      [[quiet("Repeat order di")], [strong("toko kamu sendiri,")]],
      [[accent("Tanpa potongan"), plain(".")]],
    ],
    resolusi: [
      [[strong("Marketplace")], [quiet("tetap jalan,")]],
      [
        [quiet("tapi"), strong("website"), quiet("bisa")],
        [quiet("kunci"), accent("pelanggan"), plain(".")],
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
