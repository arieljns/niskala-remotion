/**
 * npm run reel:stills -- <id>
 *
 * Needs state CHECKED. Renders one still per scene plus the first and last
 * frame, builds out/<id>/contact.png (what the human reviews before approving)
 * and out/<id>/stills.json with the motion report. Contact sheet needs
 * python3 with Pillow (pip install pillow).
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { CONTRACT_VERSION } from "../src/reels/contract/spec.schema.ts";
import { openFitSession } from "./lib/fit-probe.ts";
import { imageHash } from "./lib/image-compare.ts";
import { digestsNow, logState, reelContext, requireGate, sha256Of } from "./lib/pipeline.ts";

const id = process.argv[2];
if (!id || !/^[a-z0-9-]+$/.test(id)) {
  console.error("Pakai: npm run reel:stills -- <id>");
  process.exit(1);
}
const ctx = reelContext(id);
const blocked = requireGate(ctx, "CHECKED", "reel:stills", CONTRACT_VERSION);
if (blocked) {
  console.error(JSON.stringify({ ok: false, errors: [blocked] }, null, 2));
  process.exit(1);
}

const { spec } = (await import(ctx.specPath!)) as { spec: unknown };
const timing: unknown = JSON.parse(readFileSync(ctx.specPath!.replace(/\.ts$/, ".timing.json"), "utf8"));
const stillsDir = `${ctx.outDir}/stills`;
const session = await openFitSession();
let frames;
let motion;
try {
  frames = await session.stills(spec, timing, stillsDir);
  motion = await session.motion(spec, timing);
} finally {
  await session.close();
}

const labels = frames.map((f) => ({ file: f.file, label: `${f.scene}  f${f.frame}` }));
writeFileSync(`${ctx.outDir}/frames.json`, JSON.stringify(labels));
try {
  execFileSync(
    "python3",
    [
      "-I",
      `${import.meta.dirname}/lib/contact_sheet.py`,
      `${ctx.outDir}/frames.json`,
      stillsDir,
      `${ctx.outDir}/contact.png`,
    ],
    {
      stdio: "pipe",
    },
  );
} catch (error) {
  console.error("Gagal membuat contact sheet. Pasang Pillow: pip install pillow\n", (error as Error).message);
  process.exit(1);
}

const digests = digestsNow(ctx, CONTRACT_VERSION);
writeFileSync(
  `${ctx.outDir}/stills.json`,
  JSON.stringify(
    {
      specDigest: digests.spec,
      kitDigest: digests.kit,
      contactHash: sha256Of(readFileSync(`${ctx.outDir}/contact.png`)),
      frames: frames.map((f) => ({ ...f, sha256: imageHash(`${stillsDir}/${f.file}`) })),
      motion: { metrics: motion.metrics, findings: motion.findings.map((f) => `${f.code} ${f.message}`) },
    },
    null,
    2,
  ) + "\n",
);
logState(ctx, CONTRACT_VERSION);
console.log(
  `Contact sheet siap: out/${id}/contact.png (${frames.length} frame). Menunggu approval manusia (npm run reel:approve -- ${id}).`,
);
console.log(
  `Gerak: hold terpendek ${motion.metrics.minHoldFrames} f, maks ${motion.metrics.maxConcurrentEntrances} kata masuk bersamaan.`,
);
