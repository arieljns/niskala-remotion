/**
 * npm run guard:audit
 *
 * Run after an agent session. Reports, from the disk and not from what the agent says:
 *  1. protected files changed, added or removed since guard:lock (needs the repo to have been locked);
 *  2. approval seals that exist (only a human should have made them: check you recognise each);
 *  3. videos in out/ that did not come from reel:render (no render.json with a matching hash).
 * Exit 1 when something protected changed since the lock. Videos from before the pipeline are listed as information.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { REPO_ROOT } from "./lib/brief.ts";
import { LOCK_PATH, protectedHashes } from "./lib/guard.ts";

let bad = false;
const list = (items: string[]) => (items.length ? items.map((i) => `    ${i}`).join("\n") : "    tidak ada");

if (existsSync(LOCK_PATH)) {
  const lock = JSON.parse(readFileSync(LOCK_PATH, "utf8")) as { lockedAt: string; hashes?: Record<string, string> };
  if (lock.hashes) {
    const before = lock.hashes;
    const now = protectedHashes();
    const changed = Object.keys(before).filter((p) => p in now && now[p] !== before[p]);
    const removed = Object.keys(before).filter((p) => !(p in now));
    const added = Object.keys(now).filter((p) => !(p in before));
    bad = changed.length + removed.length + added.length > 0;
    console.log(`1. Berkas terlindung sejak dikunci (${lock.lockedAt}): ${bad ? "ADA PERUBAHAN" : "tidak ada perubahan"}`);
    if (bad) console.log(`  diubah:\n${list(changed)}\n  dihapus:\n${list(removed)}\n  ditambah:\n${list(added)}`);
  } else console.log("1. Kunci lama tanpa hash; kunci ulang dengan npm run guard:lock agar audit bisa membandingkan.");
} else {
  console.log("1. Repo tidak terkunci, jadi perubahan berkas terlindung tidak bisa diaudit. Jalankan npm run guard:lock sebelum sesi agent.");
}

const out = `${REPO_ROOT}/out`;
const dirs = existsSync(out) ? readdirSync(out).filter((n) => statSync(`${out}/${n}`).isDirectory()) : [];
console.log(`\n2. Segel approval yang ada (pastikan kamu sendiri yang menyetujuinya):`);
console.log(list(dirs.filter((d) => existsSync(`${out}/${d}/APPROVED`)).map((d) => `out/${d}/APPROVED`)));

const sha = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
const isVideo = (name: string) => /\.(mp4|mov|webm)$/.test(name);
const videos: string[] = [];
for (const name of existsSync(out) ? readdirSync(out) : []) {
  const full = `${out}/${name}`;
  if (statSync(full).isFile()) {
    if (isVideo(name)) videos.push(`out/${name}`);
  } else if (name !== "conformance") {
    for (const f of readdirSync(full).filter(isVideo)) {
      const record = `${full}/render.json`;
      const official =
        existsSync(record) &&
        (JSON.parse(readFileSync(record, "utf8")) as { mp4Sha256?: string }).mp4Sha256 === sha(`${full}/${f}`);
      if (!official) videos.push(`out/${name}/${f}`);
    }
  }
}
console.log(`\n3. Video yang BUKAN hasil reel:render (reel lama sebelum pipeline juga muncul di sini):`);
console.log(list(videos));
process.exit(bad ? 1 : 0);
