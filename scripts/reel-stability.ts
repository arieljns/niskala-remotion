/**
 * npm run reel:stability -- [--gl <angle|swangle|swiftshader|egl>] [--n 12] [--frames 867,925,1156] [--tree <dir>] [--id reel01]
 *
 * Renders the same frames N times with a shared bundle and counts how many
 * different images come out per frame. One image per frame means the render is
 * byte-stable. Used to find what makes a frame unstable, and by reel:verify.
 * `--tree` renders another copy of the source (an experiment with a feature turned off).
 * `--keep` saves one image per distinct result as out/.probe/stability/f<frame>-<hash>.png, to compare them.
 */
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { REPO_ROOT } from "./lib/brief.ts";
import { locateSpec, timingPathFor } from "./lib/check-reel.ts";

const args = process.argv.slice(2);
const opt = (name: string, fallback: string) =>
  args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : fallback;
const gl = opt("gl", "angle");
const n = Number(opt("n", "12"));
const tree = opt("tree", REPO_ROOT);
const id = opt("id", "reel01");
const frames = opt("frames", "867,925,1156").split(",").map(Number);

const located = locateSpec(id);
if (!located) {
  console.error(`Tidak ada spec "${id}".`);
  process.exit(1);
}
const { spec } = (await import(located.path)) as { spec: unknown };
const timing: unknown = JSON.parse(readFileSync(timingPathFor(located.path), "utf8"));

const out = `${REPO_ROOT}/out/.probe/stability`;
mkdirSync(out, { recursive: true });
const bundleDir = mkdtempSync(`${tmpdir()}/niskala-bundle-`);
const serveUrl = await bundle({
  entryPoint: `${tree}/src/index.ts`,
  outDir: bundleDir,
  rspack: true,
  onProgress: () => {},
});
const browser = await openBrowser("chrome", { chromiumOptions: { gl: gl as never }, logLevel: "error" });
const inputProps = { spec, timing, debugSafeZone: false, timeline: null };
const composition = await selectComposition({
  serveUrl,
  id: "Reel01",
  inputProps,
  puppeteerInstance: browser,
  logLevel: "error",
});

const seen = new Map<number, Map<string, number>>(frames.map((f) => [f, new Map()]));
for (let i = 0; i < n; i++) {
  for (const frame of frames) {
    const file = `${out}/f${frame}.png`;
    await renderStill({
      composition,
      serveUrl,
      output: file,
      frame,
      inputProps,
      puppeteerInstance: browser,
      logLevel: "error",
    });
    const hash = createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 8);
    seen.get(frame)!.set(hash, (seen.get(frame)!.get(hash) ?? 0) + 1);
    if (args.includes("--keep") && !existsSync(`${out}/f${frame}-${hash}.png`))
      copyFileSync(file, `${out}/f${frame}-${hash}.png`);
  }
}
await browser.close({ silent: true });
rmSync(bundleDir, { recursive: true, force: true });

console.log(`gl=${gl} n=${n} tree=${tree === REPO_ROOT ? "repo" : tree}`);
let unstable = 0;
for (const frame of frames) {
  const counts = seen.get(frame)!;
  if (counts.size > 1) unstable++;
  console.log(
    `  frame ${frame}: ${counts.size} gambar berbeda  [${[...counts].map(([h, c]) => `${h}x${c}`).join(" ")}]`,
  );
}
process.exit(unstable === 0 && existsSync(out) ? 0 : 1);
