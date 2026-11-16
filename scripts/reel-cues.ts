/**
 * npm run reel:cues -- <id>             suggest timing from the prepared voice-over
 * npm run reel:cues -- <id> --confirm   a human, after listening, turns it into the timing sidecar
 *
 * Writes out/<id>/cues.json: per scene the speech segments ffmpeg hears, suggested cues and
 * word times. Scenes where the number of segments differs from the number of cues the
 * kit needs are marked "low": listen to those first. Nothing here is typed by a model:
 * --confirm needs a terminal and writes src/reels/specs/<id>.timing.json with a hash of
 * cues.json, and reel:check rejects a timing file that differs from it (TIMING_NOT_CONFIRMED).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { REPO_ROOT } from "./lib/brief.ts";
import { speechSegments } from "./lib/ffmpeg.ts";
import { buildTimingFromCues, proposeTiming, type SceneAnalysis } from "./lib/timing.ts";
import { lintVo } from "./lib/vo.ts";
import { wavInfo } from "./lib/wav.ts";
import { SCENE_IDS, type TimedSceneId } from "../src/reels/contract/timing-types.ts";

const id = process.argv[2];
if (!id || !/^[a-z0-9-]+$/.test(id)) {
  console.error("Pakai: npm run reel:cues -- <id> [--confirm]");
  process.exit(1);
}
const voDir = `${REPO_ROOT}/public/reels/${id}/vo`;
const cuesPath = `${REPO_ROOT}/out/${id}/cues.json`;
const timingPath = `${REPO_ROOT}/src/reels/specs/${id}.timing.json`;

if (process.argv.includes("--confirm")) {
  if (!existsSync(cuesPath)) {
    console.error("Belum ada out/<id>/cues.json. Jalankan dulu: npm run reel:cues -- " + id);
    process.exit(1);
  }
  if (!process.stdin.isTTY) {
    console.error(
      "--confirm harus dijalankan manusia di terminalnya sendiri, setelah mendengarkan rekaman. Agent tidak boleh mengonfirmasi.",
    );
    process.exit(1);
  }
  const cues = JSON.parse(readFileSync(cuesPath, "utf8")) as { scenes: Record<string, { confidence: string }> };
  const low = Object.entries(cues.scenes)
    .filter(([, s]) => s.confidence === "low")
    .map(([scene]) => scene);
  console.log(`Dengarkan rekaman di public/reels/${id}/vo/ dan bandingkan dengan out/${id}/cues.json.`);
  if (low.length) console.log(`Scene dengan keyakinan rendah (periksa dulu): ${low.join(", ")}`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question("Ketik nama kamu lalu CONFIRM: ")).trim();
  rl.close();
  const match = /^(.*\S)\s+CONFIRM$/.exec(answer);
  if (!match) {
    console.error('Format salah. Ketik nama lalu kata CONFIRM persis, mis. "Ariel CONFIRM".');
    process.exit(1);
  }
  writeFileSync(
    timingPath,
    JSON.stringify(buildTimingFromCues(readFileSync(cuesPath, "utf8"), match[1]), null, 2) + "\n",
  );
  console.log(`Dikonfirmasi oleh ${match[1]}: ${timingPath.replace(`${REPO_ROOT}/`, "")}`);
  process.exit(0);
}

const problems = lintVo(voDir);
if (problems.length) {
  console.error(JSON.stringify({ ok: false, errors: problems }, null, 2));
  process.exit(1);
}
const specPath = `${REPO_ROOT}/src/reels/specs/${id}.ts`;
if (!existsSync(specPath)) {
  console.error(`Belum ada spec src/reels/specs/${id}.ts. Copy menentukan berapa kata tiap frasa, jadi isi spec dulu.`);
  process.exit(1);
}
const { spec } = (await import(specPath)) as { spec: Parameters<typeof proposeTiming>[3] };

const analyses = {} as Record<TimedSceneId, SceneAnalysis>;
const missing: string[] = [];
for (const scene of SCENE_IDS) {
  const file = `${voDir}/${scene}.wav`;
  const info = existsSync(file) ? wavInfo(file) : null;
  if (!info) {
    missing.push(`${scene}.wav`);
    continue;
  }
  analyses[scene] = { file: `${scene}.wav`, seconds: info.seconds, segments: speechSegments(file, info.seconds) };
}
if (missing.length) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        errors: missing.map((file) => ({
          code: "VO_MISSING",
          path: file,
          message: `public/reels/${id}/vo/${file} tidak ada.`,
          hint: "Rekam scene itu lalu jalankan reel:vo-prep.",
        })),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const cues = proposeTiming(id, `reels/${id}/vo`, analyses, spec);
mkdirSync(`${REPO_ROOT}/out/${id}`, { recursive: true });
writeFileSync(cuesPath, JSON.stringify(cues, null, 2) + "\n");
console.log("scene  segmen  cue  keyakinan");
for (const scene of SCENE_IDS) {
  const s = cues.scenes[scene];
  console.log(
    `${scene.padEnd(5)}  ${String(s.segments.length).padStart(4)}   ${String(s.cues.length).padStart(3)}  ${s.confidence}`,
  );
}
console.log(`\nSaran ditulis ke out/${id}/cues.json. Ini SARAN dari deteksi jeda, bukan pengenalan suara.`);
console.log(
  "Dengarkan rekaman, periksa terutama scene 'low', lalu manusia menjalankan: npm run reel:cues -- " +
    id +
    " --confirm",
);
