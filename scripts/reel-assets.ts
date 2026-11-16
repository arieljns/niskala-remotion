/**
 * npm run reel:assets [-- --json]
 *
 * Reports the asset manifest: every asset, its license, where it is used, whether
 * its file still matches its hash, files in the kit's asset folders that nobody
 * registered, and assets whose license is still TODO. Exit 1 on ASSET_UNKNOWN or
 * ASSET_HASH_MISMATCH.
 */
import { checkAssets, loadManifest } from "./lib/assets.ts";

const manifest = loadManifest();
const errors = checkAssets();
const todo = manifest.assets.filter((a) => a.license === "TODO");
const unused = manifest.assets.filter((a) => a.usedIn.length === 0);

if (process.argv.includes("--json")) {
  console.log(
    JSON.stringify(
      {
        ok: errors.length === 0,
        assets: manifest.assets.length,
        licenseTodo: todo.map((a) => a.id),
        unused: unused.map((a) => a.id),
        errors,
      },
      null,
      2,
    ),
  );
} else {
  console.log(`${manifest.assets.length} aset terdaftar`);
  for (const a of manifest.assets)
    console.log(
      `  ${a.type.padEnd(8)} ${a.id.padEnd(36)} ${a.license.padEnd(13)} dipakai: ${a.usedIn.join(", ") || "(belum ada)"}`,
    );
  if (todo.length) console.log(`\nLisensi masih TODO (${todo.length}): ${todo.map((a) => a.id).join(", ")}`);
  if (unused.length) console.log(`Terdaftar tapi belum dipakai reel mana pun: ${unused.map((a) => a.id).join(", ")}`);
  for (const e of errors) console.log(`\n[${e.code}] ${e.path}\n  ${e.message}\n  -> ${e.hint}`);
  if (errors.length === 0) console.log("\nSemua file cocok dengan manifest.");
}
process.exit(errors.length === 0 ? 0 : 1);
