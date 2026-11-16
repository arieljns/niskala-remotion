/**
 * npm run reel:vo-prep -- <id>
 *
 * Normalises the voice-over of a reel: reads public/reels/<id>/vo-raw/<scene>.<wav|mp3|m4a>,
 * trims silence at both ends, sets loudness to -16 LUFS, writes 48 kHz mono WAV to
 * public/reels/<id>/vo/<scene>.wav and records hashes in vo/prep.json. Uses the
 * ffmpeg that ships with Remotion. Scene ids: s1 s2 s3 s4 s5 s6 s7 s7b s8a s8b s8c s8d s9 s10.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { REPO_ROOT } from "./lib/brief.ts";
import { SCENE_IDS } from "../src/reels/contract/timing-types.ts";
import { describeOutput, prepareOne, TARGET_LUFS, type PrepRecord } from "./lib/vo.ts";

const id = process.argv[2];
if (!id || !/^[a-z0-9-]+$/.test(id)) {
  console.error("Pakai: npm run reel:vo-prep -- <id>");
  process.exit(1);
}
const raw = `${REPO_ROOT}/public/reels/${id}/vo-raw`;
const out = `${REPO_ROOT}/public/reels/${id}/vo`;
if (!existsSync(raw)) {
  console.error(`Tidak ada folder rekaman mentah: public/reels/${id}/vo-raw/ (isi dengan <scene>.wav, mis. s1.wav).`);
  process.exit(1);
}
mkdirSync(out, { recursive: true });

const record: PrepRecord = { version: 1, targetLufs: TARGET_LUFS, files: {} };
const names = readdirSync(raw);
const missing: string[] = [];
for (const scene of SCENE_IDS) {
  const input = names.find((name) => name.replace(/\.[^.]+$/, "") === scene);
  if (!input) {
    missing.push(scene);
    continue;
  }
  const result = prepareOne(`${raw}/${input}`, `${out}/${scene}.wav`);
  if (!result.ok) {
    console.error(`${scene}: ${result.message}`);
    process.exit(1);
  }
  record.files[`${scene}.wav`] = describeOutput(`${out}/${scene}.wav`, result.inputLufs);
  console.log(
    `${scene}: ${result.inputLufs.toFixed(1)} LUFS -> ${TARGET_LUFS}, ${record.files[`${scene}.wav`].seconds}s`,
  );
}
writeFileSync(`${out}/prep.json`, JSON.stringify(record, null, 2) + "\n");
if (missing.length) console.log(`\nBelum ada rekaman untuk scene: ${missing.join(", ")}`);
console.log(
  `\nSelesai: ${Object.keys(record.files).length} file di public/reels/${id}/vo/. Berikutnya: npm run reel:cues -- ${id}`,
);
