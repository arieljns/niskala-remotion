/**
 * npm run reel:fit-baseline
 *
 * Measures Reel01's own copy and writes src/reels/contract/fit-limits.json:
 * for each kind of text, the smallest read scale Reel01 itself reaches. A new
 * reel's text may never read smaller than Reel01's does (TODO_MIN_SCALE,
 * derived from the reference; the owner may raise it). Rerun only when
 * Reel01 changes on purpose.
 */
import { writeFileSync } from "node:fs";
import { spec } from "../src/reels/specs/_golden/reel01.ts";
import timing from "../src/reels/specs/_golden/reel01.timing.json" with { type: "json" };
import { FIT_LIMITS_PATH, openFitSession, type FitKind, type FitLimits } from "./lib/fit-probe.ts";

const session = await openFitSession();
const entries = await session.measure(spec, timing);
await session.close();

const minReadScale = {} as Record<FitKind, number>;
for (const kind of ["sentence", "hook", "stop", "punch", "squash"] as const) {
  const scales = entries.filter((entry) => entry.kind === kind).map((entry) => entry.readScale);
  minReadScale[kind] = Math.floor(Math.min(...scales) * 10000) / 10000;
  console.log(`${kind.padEnd(8)} ${scales.length} entri, terkecil ${minReadScale[kind]}`);
}
const limits: FitLimits = {
  _derivedFrom: "Reel01 golden spec, measured in Chromium with the real fonts",
  minReadScale,
};
writeFileSync(FIT_LIMITS_PATH, JSON.stringify(limits, null, 2) + "\n");
console.log(`Ditulis: ${FIT_LIMITS_PATH}`);
for (const entry of entries)
  console.log(
    `  ${entry.path.padEnd(26)} ${entry.kind.padEnd(8)} ${String(entry.widthPx).padStart(4)}px  scale ${entry.readScale.toFixed(3)}`,
  );
