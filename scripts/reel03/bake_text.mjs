// Words -> outline commands at font size 100, Senja tracking (-0.045em), y-up. See bake_text.py.
import { readFileSync, writeFileSync } from "node:fs";
import opentype from "opentype.js";

const here = new URL(".", import.meta.url).pathname;
const WORDS = [
  ["This.", 500],
  ["Is how.", 500],
  ["Niskala.", 500],
  ["Works.", 500],
  ["Mora Jaya", 500],
  ["× Niskala", 500],
  ["Pesan lewat", 500],
  ["WhatsApp", 500],
  ["PESANAN", 500],
  ["Laporan", 500],
  ["harian", 500],
  ["Pelanggan", 500],
  ["CRM", 500],
  ["Promo", 500],
  ["Diskon", 500],
  ["Status", 500],
  ["pesanan", 500],
  ["Konfirmasi", 500],
  ["selesai", 500],
];

const fonts = {};
const out = {};
for (const [text, weight] of WORDS) {
  fonts[weight] ??= opentype.parse(readFileSync(`${here}.cache/archivo125-${weight}.ttf`).buffer.slice(0));
  const font = fonts[weight];
  const path = font.getPath(text, 0, 0, 100, { letterSpacing: -0.045, kerning: true });
  const box = path.getBoundingBox();
  out[text] = {
    width: box.x2 - box.x1,
    capHeight: -box.y1,
    // y flipped so the shapes are y-up like three.js; x shifted so the box starts at 0.
    commands: path.commands.map((c) => {
      const flip = { ...c };
      for (const key of ["x", "x1", "x2"]) if (key in flip) flip[key] = c[key] - box.x1;
      for (const key of ["y", "y1", "y2"]) if (key in flip) flip[key] = -c[key];
      return flip;
    }),
    height: box.y2 - box.y1,
    descent: box.y2,
  };
}
writeFileSync(new URL("../../src/reels/reel03/textShapes.json", import.meta.url), JSON.stringify(out));
console.log(Object.entries(out).map(([k, v]) => `${k}: ${v.width.toFixed(0)} x ${v.height.toFixed(0)}`).join("\n"));
