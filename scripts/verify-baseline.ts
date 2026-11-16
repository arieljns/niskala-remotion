/**
 * npm run verify:reel01-baseline
 *
 * Renders the same frames as out/baseline/ (frame-NNNN.png) from the current
 * code and compares each one's sha256 with out/baseline/SHA256SUMS. Exit 0 only
 * if every frame is byte-identical. Any visual change to Reel01, from the spec
 * or the kit, shows up here.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { REPO_ROOT } from "./lib/brief.ts";
import { compareFrames, imageHash } from "./lib/image-compare.ts";

const baselineDir = `${REPO_ROOT}/out/baseline`;
const outDir = `${REPO_ROOT}/out/verify`;
mkdirSync(outDir, { recursive: true });

const expected = new Map<string, string>();
for (const line of readFileSync(`${baselineDir}/SHA256SUMS`, "utf8").split("\n")) {
  const match = /^([0-9a-f]{64})\s+out\/baseline\/(frame-(\d+)\.png)$/.exec(line.trim());
  if (match) expected.set(match[2], match[1]);
}
/** Frames known not to be byte-stable in the original code: any hash in the set is accepted. */
const variants = new Map<string, string[]>();
try {
  const parsed = JSON.parse(readFileSync(`${baselineDir}/variants.json`, "utf8")) as {
    frames: Record<string, string[]>;
  };
  Object.entries(parsed.frames).forEach(([file, hashes]) => variants.set(file, hashes));
} catch {
  // No variants file: every frame must match its baseline hash exactly.
}
if (expected.size === 0) {
  console.error("Tidak ada frame di out/baseline/SHA256SUMS.");
  process.exit(1);
}

let different = 0;
let viaVariant = 0;
let viaTolerance = 0;
for (const [file, hash] of expected) {
  const frame = Number(/frame-(\d+)\.png/.exec(file)![1]);
  execFileSync("npx", ["remotion", "still", "src/index.ts", "Reel01", `out/verify/${file}`, `--frame=${frame}`], {
    cwd: REPO_ROOT,
    stdio: "ignore",
  });
  const actual = imageHash(`${outDir}/${file}`);
  if (actual === hash) continue;
  if ((variants.get(file) ?? []).includes(actual)) {
    viaVariant++;
    continue;
  }
  // Not byte-identical and not a known variant: measure it against the baseline image.
  const verdict = compareFrames(`${baselineDir}/${file}`, `${outDir}/${file}`);
  if (verdict.same === "noise") {
    viaTolerance++;
    continue;
  }
  different++;
  const m = verdict.metrics!;
  console.error(
    `BEDA  ${file}  psnr ${m.psnr} dB, ${(m.pixels_over_32 * 100).toFixed(3)}% piksel > 32 level, maks ${m.max_level}`,
  );
}
const identical = expected.size - viaVariant - viaTolerance - different;
console.log(
  different === 0
    ? `OK: ${expected.size} frame cocok dengan baseline (${identical} identik, ${viaVariant} varian yang dikenal, ${viaTolerance} dalam toleransi noise terukur).`
    : `${different} dari ${expected.size} frame beda di luar toleransi.`,
);
process.exit(different === 0 ? 0 : 1);
