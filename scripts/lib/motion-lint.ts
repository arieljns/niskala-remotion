/**
 * Turns the browser's motion report into errors, against limits derived from
 * Reel01 (src/reels/contract/motion-limits.json): Reel01 is the reference, so
 * nothing may be tighter, shorter or busier than it.
 */
import { readFileSync } from "node:fs";
import { REPO_ROOT } from "./brief.ts";
import type { SpecError } from "./copy-lint.ts";
import type { MotionReport } from "../../src/reels/contract/motion-types.ts";

export const MOTION_LIMITS_PATH = `${REPO_ROOT}/src/reels/contract/motion-limits.json`;

export type MotionLimits = {
  _derivedFrom: string;
  /** The brief's floor for how long a sentence holds, in frames (MIN_HOLD in reel01/timeline.ts). */
  minHoldFrames: number;
  /** Scenes whose holds are structurally short in Reel01 (S8 beats play back-to-back): never shorter than Reel01's. */
  holdExceptions: Record<string, number>;
  maxConcurrentEntrances: number;
};

const holdOf = (message: string) => Number(/hold is (-?\d+) f/.exec(message)?.[1] ?? NaN);
/** Finding paths start with the scene id ("s8b Sekali tap,"). */
const sceneOf = (path: string) => path.split(" ")[0];

export function lintMotion(report: MotionReport, limits: MotionLimits = loadMotionLimits()): SpecError[] {
  const errors: SpecError[] = [];
  for (const finding of report.findings) {
    if (finding.code === "SAFE_ZONE_VIOLATION") {
      errors.push({
        code: "SAFE_ZONE_VIOLATION",
        path: finding.path,
        message: finding.message,
        hint: "Pendekkan copy supaya muat di zona aman Reels dan TikTok. Jangan ubah kamera atau layout.",
      });
      continue;
    }
    const hold = holdOf(finding.message);
    const allowed = limits.holdExceptions[sceneOf(finding.path)] ?? limits.minHoldFrames;
    if (!(hold >= allowed)) {
      errors.push({
        code: "HOLD_TOO_SHORT",
        path: finding.path,
        message: `${finding.message}. Batas untuk adegan ini ${allowed} f (Reel01).`,
        hint: "Pendekkan copy atau kurangi jumlah kata di frasa ini supaya kalimat sempat ditahan.",
      });
    }
  }
  if (report.metrics.maxConcurrentEntrances > limits.maxConcurrentEntrances) {
    errors.push({
      code: "MOTION_BUDGET",
      path: "",
      message: `${report.metrics.maxConcurrentEntrances} kata masuk bersamaan; batas Reel01 ${limits.maxConcurrentEntrances}.`,
      hint: "Kata terlalu rapat. Kurangi jumlah kata per frasa; jangan ubah timing.",
    });
  }
  return errors;
}

export function loadMotionLimits(): MotionLimits {
  return JSON.parse(readFileSync(MOTION_LIMITS_PATH, "utf8")) as MotionLimits;
}
