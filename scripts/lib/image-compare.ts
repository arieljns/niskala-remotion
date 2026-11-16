/**
 * Compares two rendered frames. The same frame is not always byte-identical from
 * render to render on one machine (a race that depends on machine load), so the
 * verdict is "identical" or "within the measured noise" (contract/diff-limits.json).
 * Needs python3 with Pillow, like the contact sheet.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { REPO_ROOT } from "./brief.ts";

export type DiffMetrics = {
  pixels_over_16: number;
  pixels_over_32: number;
  differing_pixels: number;
  max_level: number;
  psnr: number;
};
export type DiffLimits = { psnrMin: number; over32Max: number; maxLevel: number };
export type Verdict = { same: "identical" | "noise" | "different"; metrics: DiffMetrics | null };

export const DIFF_LIMITS_PATH = `${REPO_ROOT}/src/reels/contract/diff-limits.json`;
export const loadDiffLimits = (): DiffLimits => JSON.parse(readFileSync(DIFF_LIMITS_PATH, "utf8")) as DiffLimits;

export const imageHash = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

export function withinTolerance(m: DiffMetrics, limits: DiffLimits = loadDiffLimits()): boolean {
  return m.psnr >= limits.psnrMin && m.pixels_over_32 <= limits.over32Max && m.max_level <= limits.maxLevel;
}

export function measureDiff(a: string, b: string): DiffMetrics {
  const out = execFileSync("python3", ["-W", "ignore", "-I", `${REPO_ROOT}/scripts/lib/image_diff.py`, a, b], {
    encoding: "utf8",
  });
  const parsed = JSON.parse(out) as DiffMetrics & { size_mismatch?: unknown };
  if (parsed.size_mismatch) throw new Error("Frame sizes differ");
  return parsed;
}

export function compareFrames(a: string, b: string, limits: DiffLimits = loadDiffLimits()): Verdict {
  if (imageHash(a) === imageHash(b)) return { same: "identical", metrics: null };
  const metrics = measureDiff(a, b);
  return { same: withinTolerance(metrics, limits) ? "noise" : "different", metrics };
}
