/**
 * The asset manifest: the only assets a reel may use. Assets come from Reel01's
 * set; a model may not add images, icons or sounds of its own. A file that sits in
 * a kit asset folder without a manifest entry is ASSET_UNKNOWN; a listed file whose
 * bytes changed (or vanished) is ASSET_HASH_MISMATCH.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { REPO_ROOT } from "./brief.ts";
import type { SpecError } from "./copy-lint.ts";

export const ASSET_TYPES = ["sfx", "music", "logo", "product", "ui", "footage", "font"] as const;
export const LICENSES = ["own", "royalty-free", "TODO"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];
export type License = (typeof LICENSES)[number];

export type ManifestEntry = {
  id: string;
  type: AssetType;
  /** Relative to the repo root, under public/. */
  path: string;
  license: License;
  sha256: string;
  usedIn: string[];
  note?: string;
};
export type Manifest = { version: 1; assets: ManifestEntry[] };

/** Folders the kit reads assets from. Anything in them must be in the manifest. */
export const KIT_ASSET_DIRS = ["public/reels/reel01-pack/reel01/products", "public/fonts", "public/reels/_shared"];
export const MANIFEST_PATH = "public/reels/_shared/manifest.json";

export const sha256File = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

export function loadManifest(root: string = REPO_ROOT): Manifest {
  const path = `${root}/${MANIFEST_PATH}`;
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Manifest) : { version: 1, assets: [] };
}

function filesIn(root: string, dir: string): string[] {
  const abs = `${root}/${dir}`;
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((name) => !name.startsWith("."))
    .flatMap((name) => {
      const rel = `${dir}/${name}`;
      return statSync(`${root}/${rel}`).isDirectory() ? filesIn(root, rel) : [rel];
    });
}

export function checkAssets(root: string = REPO_ROOT): SpecError[] {
  const manifest = loadManifest(root);
  const errors: SpecError[] = [];
  const listed = new Set(manifest.assets.map((a) => a.path));

  for (const entry of manifest.assets) {
    if (!existsSync(`${root}/${entry.path}`)) {
      errors.push({
        code: "ASSET_HASH_MISMATCH",
        path: entry.path,
        message: `Aset "${entry.id}" ada di manifest tapi file-nya hilang.`,
        hint: "Kembalikan file atau hapus entrinya lewat persetujuan pemilik.",
      });
    } else if (sha256File(`${root}/${entry.path}`) !== entry.sha256) {
      errors.push({
        code: "ASSET_HASH_MISMATCH",
        path: entry.path,
        message: `Isi aset "${entry.id}" berbeda dari hash di manifest.`,
        hint: "Aset tidak boleh diubah diam-diam. Kembalikan file aslinya.",
      });
    }
  }
  for (const rel of KIT_ASSET_DIRS.flatMap((dir) => filesIn(root, dir))) {
    if (rel === MANIFEST_PATH || listed.has(rel)) continue;
    errors.push({
      code: "ASSET_UNKNOWN",
      path: rel,
      message: "File ada di folder aset kit tapi tidak terdaftar di manifest.",
      hint: "Aset hanya dari manifest (set Reel01). Model tidak boleh menambah gambar, ikon, atau suara sendiri; minta pemilik mendaftarkannya lewat reel:promote-asset.",
    });
  }
  return errors;
}
