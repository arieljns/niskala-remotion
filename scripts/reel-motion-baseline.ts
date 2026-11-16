/**
 * npm run reel:motion-baseline
 *
 * Measures Reel01's own motion and writes src/reels/contract/motion-limits.json:
 * the brief's hold floor, the holds that are structurally short in Reel01 (kept
 * as exceptions per scene, never shorter), and the most words Reel01 ever
 * enters at once. A new reel may not be busier or tighter than the reference.
 */
import { writeFileSync } from "node:fs";
import { spec } from "../src/reels/specs/_golden/reel01.ts";
import timing from "../src/reels/specs/_golden/reel01.timing.json" with { type: "json" };
import { openFitSession } from "./lib/fit-probe.ts";
import { MOTION_LIMITS_PATH, type MotionLimits } from "./lib/motion-lint.ts";

/** MIN_HOLD in src/reels/reel01/timeline.ts: the brief's floor. */
const MIN_HOLD_FRAMES = 15;

const session = await openFitSession();
const report = await session.motion(spec, timing);
await session.close();

const holdExceptions: Record<string, number> = {};
for (const finding of report.findings) {
  if (finding.code !== "HOLD_TOO_SHORT") {
    console.error(
      `Reel01 sendiri punya temuan ${finding.code}: ${finding.message}. Perbaiki Reel01 dulu atau jelaskan.`,
    );
    process.exit(1);
  }
  const scene = finding.path.split(" ")[0];
  const hold = Number(/hold is (\d+) f/.exec(finding.message)![1]);
  holdExceptions[scene] = Math.min(holdExceptions[scene] ?? Infinity, hold);
}

const limits: MotionLimits = {
  _derivedFrom: "Reel01 golden spec, measured in Chromium (debug render)",
  minHoldFrames: MIN_HOLD_FRAMES,
  holdExceptions,
  maxConcurrentEntrances: report.metrics.maxConcurrentEntrances,
};
writeFileSync(MOTION_LIMITS_PATH, JSON.stringify(limits, null, 2) + "\n");
console.log(`Ditulis: ${MOTION_LIMITS_PATH}\n${JSON.stringify(limits, null, 2)}`);
