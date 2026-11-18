/**
 * npm run reel:render4 -- <id> [composition]
 *
 * Workflow v4 render. Satu-satunya gerbang: out/<id>/approvals.md harus punya baris `SHEET`.
 * composition default = id (mis. Reel03). Hasil: out/<id>/<id>.mp4.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";

const [id, composition = id] = process.argv.slice(2);
if (!id || !/^[A-Za-z0-9-]+$/.test(id)) {
  console.error("Pakai: npm run reel:render4 -- <id> [composition]");
  process.exit(1);
}
const approvals = `out/${id}/approvals.md`;
if (!existsSync(approvals) || !/\bSHEET\b/.test(readFileSync(approvals, "utf8"))) {
  console.error(`DITOLAK: ${approvals} belum punya baris approve SHEET.`);
  process.exit(1);
}
mkdirSync(`out/${id}`, { recursive: true });
const run = spawnSync("npx", ["remotion", "render", composition, `out/${id}/${id}.mp4`], { stdio: "inherit" });
process.exit(run.status ?? 1);
