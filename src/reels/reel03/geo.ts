import * as THREE from "three";
import shapes from "./textShapes.json";

/** A rounded rectangle centred on the origin. */
export function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  const rr = Math.max(0.5, Math.min(r, w / 2, h / 2));
  s.moveTo(x + rr, y);
  s.lineTo(x + w - rr, y);
  s.absarc(x + w - rr, y + rr, rr, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - rr);
  s.absarc(x + w - rr, y + h - rr, rr, 0, Math.PI / 2, false);
  s.lineTo(x + rr, y + h);
  s.absarc(x + rr, y + h - rr, rr, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + rr);
  s.absarc(x + rr, y + rr, rr, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** A solid rounded slab, centred on the origin. Its front face sits at z = depth / 2 + bevel. */
export function slabGeometry(w: number, h: number, r: number, depth: number, bevel = 5): THREE.ExtrudeGeometry {
  const g = new THREE.ExtrudeGeometry(roundedRect(w - 2 * bevel, h - 2 * bevel, r - bevel), {
    depth,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 5,
    curveSegments: 24,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** A flat rounded face whose UVs show the (u0, v0)-(u1, v1) part of a texture (v up). */
export function faceGeometry(w: number, h: number, r: number, uv: [number, number, number, number] = [0, 0, 1, 1]): THREE.ShapeGeometry {
  const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 24);
  const pos = g.getAttribute("position");
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2] = uv[0] + ((pos.getX(i) + w / 2) / w) * (uv[2] - uv[0]);
    uvs[i * 2 + 1] = uv[1] + ((pos.getY(i) + h / 2) / h) * (uv[3] - uv[1]);
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  return g;
}

type Command = { type: string; x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number };
type Baked = { width: number; capHeight: number; height: number; commands: Command[] };
const baked = shapes as unknown as Record<string, Baked>;

export type WordKey =
  | "This."
  | "Is how."
  | "Niskala."
  | "Works."
  | "Mora Jaya"
  | "× Niskala"
  | "Pesan lewat"
  | "WhatsApp"
  | "PESANAN"
  | "Laporan"
  | "harian"
  | "Pelanggan"
  | "CRM"
  | "Promo"
  | "Diskon"
  | "Status"
  | "pesanan"
  | "Konfirmasi"
  | "selesai";

/** The word as an extruded solid, centred on the origin, `size` px tall for a 100 px font (so size 1.76 = 176 px type). */
export function wordGeometry(key: WordKey, scale: number, depth: number): THREE.BufferGeometry {
  const word = baked[key];
  const path = new THREE.ShapePath();
  for (const c of word.commands) {
    if (c.type === "M") path.moveTo(c.x!, c.y!);
    else if (c.type === "L") path.lineTo(c.x!, c.y!);
    else if (c.type === "C") path.bezierCurveTo(c.x1!, c.y1!, c.x2!, c.y2!, c.x!, c.y!);
    else if (c.type === "Q") path.quadraticCurveTo(c.x1!, c.y1!, c.x!, c.y!);
  }
  // Type is flat 2D (depth is kept in the signature so call sites stay the same).
  void depth;
  const g = new THREE.ShapeGeometry(path.toShapes(), 10);
  g.translate(-word.width / 2, -word.capHeight / 2, 0);
  g.scale(scale, scale, scale);
  return g;
}

export const wordWidth = (key: WordKey, scale: number): number => baked[key].width * scale;
