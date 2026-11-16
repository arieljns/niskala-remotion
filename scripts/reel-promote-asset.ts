/**
 * npm run reel:promote-asset -- <path-under-public> --id <id> --type <type> --license <own|royalty-free|TODO>
 *
 * Registers a new asset in the shared manifest: copies the file to
 * public/reels/_shared/<type>/<name> (the original stays where it is), hashes it,
 * adds the entry. Meant for the owner: assets come from Reel01's set, and a model
 * may not add its own. Refuses to overwrite an existing id or file.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { REPO_ROOT } from "./lib/brief.ts";
import {
  ASSET_TYPES,
  LICENSES,
  MANIFEST_PATH,
  loadManifest,
  sha256File,
  type AssetType,
  type License,
} from "./lib/assets.ts";

const args = process.argv.slice(2);
const flag = (name: string) => args[args.indexOf(`--${name}`) + 1];
const source = args[0];
const id = flag("id");
const type = flag("type") as AssetType;
const license = flag("license") as License;

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};
if (!source || source.startsWith("--") || !id || !type || !license)
  fail("Pakai: npm run reel:promote-asset -- <path> --id <id> --type <type> --license <license>");
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail("--id harus slug huruf kecil, angka, tanda minus.");
if (!ASSET_TYPES.includes(type)) fail(`--type salah. Pilihan: ${ASSET_TYPES.join(", ")}`);
if (!LICENSES.includes(license)) fail(`--license salah. Pilihan: ${LICENSES.join(", ")}`);
if (!existsSync(`${REPO_ROOT}/${source}`)) fail(`File tidak ada: ${source}`);

const manifest = loadManifest();
if (manifest.assets.some((a) => a.id === id)) fail(`Id sudah dipakai: ${id}`);
const target = `public/reels/_shared/${type}/${basename(source)}`;
if (existsSync(`${REPO_ROOT}/${target}`)) fail(`Sudah ada file di ${target}`);

mkdirSync(`${REPO_ROOT}/public/reels/_shared/${type}`, { recursive: true });
copyFileSync(`${REPO_ROOT}/${source}`, `${REPO_ROOT}/${target}`);
manifest.assets.push({ id, type, path: target, license, sha256: sha256File(`${REPO_ROOT}/${target}`), usedIn: [] });
writeFileSync(`${REPO_ROOT}/${MANIFEST_PATH}`, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Terdaftar: ${id} -> ${target} (lisensi ${license}). File asli di ${source} tidak diubah.`);
