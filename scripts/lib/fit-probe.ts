/**
 * Measures a spec's copy with the renderer's own layout code, in headless
 * Chromium with the real fonts (FitProbe composition). Bundling takes a while,
 * so a session bundles once and measures many specs.
 */
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { readFileSync } from "node:fs";
import { REPO_ROOT } from "./brief.ts";
import type { SpecError } from "./copy-lint.ts";
import type { FitEntry, FitKind } from "../../src/reels/contract/fit-types.ts";
import { MOTION_REPORT_MARKER, type MotionReport } from "../../src/reels/contract/motion-types.ts";

export type { FitEntry, FitKind };
export type FitLimits = { _derivedFrom: string; minReadScale: Record<FitKind, number> };

export const FIT_LIMITS_PATH = `${REPO_ROOT}/src/reels/contract/fit-limits.json`;

/**
 * Remotion forwards every console.log from the bundle to stdout whatever the
 * logLevel, which would bury a JSON report. Mute stdout and stderr while a probe runs.
 */
async function quiet<T>(work: () => Promise<T>): Promise<T> {
  const out = process.stdout.write.bind(process.stdout);
  const err = process.stderr.write.bind(process.stderr);
  process.stdout.write = (() => true) as typeof process.stdout.write;
  process.stderr.write = (() => true) as typeof process.stderr.write;
  try {
    return await work();
  } finally {
    process.stdout.write = out;
    process.stderr.write = err;
  }
}

export async function openFitSession() {
  // Own the bundle folder so close() can delete it; Remotion otherwise leaves a full copy in /tmp on every run.
  const bundleDir = mkdtempSync(`${tmpdir()}/niskala-bundle-`);
  const serveUrl = await bundle({
    entryPoint: `${REPO_ROOT}/src/index.ts`,
    outDir: bundleDir,
    rspack: true,
    onProgress: () => {},
  });
  const browser = await openBrowser("chrome", { chromiumOptions: { gl: "angle" }, logLevel: "error" });

  const measure = async (spec: unknown, timing: unknown): Promise<FitEntry[]> => {
    const composition = await selectComposition({
      serveUrl,
      id: "FitProbe",
      inputProps: { spec, timing },
      puppeteerInstance: browser,
      logLevel: "error",
    });
    return (composition.props as { fit: FitEntry[] }).fit;
  };

  /** Motion and safe-zone report: renders one frame of Reel01 in debug mode and reads the JSON line it logs. */
  const motion = async (spec: unknown, timing: unknown): Promise<MotionReport> => {
    const inputProps = { spec, timing, debugSafeZone: true, timeline: null };
    const composition = await selectComposition({
      serveUrl,
      id: "Reel01",
      inputProps,
      puppeteerInstance: browser,
      logLevel: "error",
    });
    mkdirSync(`${REPO_ROOT}/out/.probe`, { recursive: true });
    let report: MotionReport | null = null;
    const problems: string[] = [];
    await renderStill({
      composition,
      serveUrl,
      output: `${REPO_ROOT}/out/.probe/motion.png`,
      frame: 0,
      inputProps,
      puppeteerInstance: browser,
      logLevel: "error",
      onBrowserLog: (log) => {
        if (log.text.startsWith(MOTION_REPORT_MARKER)) {
          report = JSON.parse(log.text.slice(MOTION_REPORT_MARKER.length)) as MotionReport;
        } else if (log.type === "error") {
          problems.push(log.text);
        }
      },
    });
    if (!report) throw new Error(`Probe gerak tidak menghasilkan laporan. ${problems.join(" | ")}`);
    return report;
  };

  /** Length of the reel in seconds, as the Reel01 composition computes it from the timing. */
  const duration = async (spec: unknown, timing: unknown): Promise<number> => {
    const composition = await selectComposition({
      serveUrl,
      id: "Reel01",
      inputProps: { spec, timing, debugSafeZone: false, timeline: null },
      puppeteerInstance: browser,
      logLevel: "error",
    });
    return composition.durationInFrames / composition.fps;
  };

  /** One still per scene (its middle frame) plus the first and last frame, for the contact sheet. */
  const stills = async (
    spec: unknown,
    timing: unknown,
    outDir: string,
  ): Promise<{ frame: number; scene: string; file: string }[]> => {
    const inputProps = { spec, timing, debugSafeZone: false, timeline: null };
    const composition = await selectComposition({
      serveUrl,
      id: "Reel01",
      inputProps,
      puppeteerInstance: browser,
      logLevel: "error",
    });
    const { timeline } = composition.props as {
      timeline: { order: string[]; scenes: Record<string, { from: number; durationInFrames: number }> };
    };
    const picks = [
      { scene: "start", frame: 0 },
      ...timeline.order.map((id) => ({
        scene: id,
        frame: timeline.scenes[id].from + Math.floor(timeline.scenes[id].durationInFrames / 2),
      })),
      { scene: "end", frame: composition.durationInFrames - 1 },
    ];
    mkdirSync(outDir, { recursive: true });
    const made: { frame: number; scene: string; file: string }[] = [];
    for (const pick of picks) {
      const file = `frame-${String(pick.frame).padStart(4, "0")}.png`;
      await renderStill({
        composition,
        serveUrl,
        output: `${outDir}/${file}`,
        frame: pick.frame,
        inputProps,
        puppeteerInstance: browser,
        logLevel: "error",
      });
      made.push({ ...pick, file });
    }
    return made;
  };

  return {
    serveUrl,
    browser,
    stills: (spec: unknown, timing: unknown, outDir: string) => quiet(() => stills(spec, timing, outDir)),
    measure: (spec: unknown, timing: unknown) => quiet(() => measure(spec, timing)),
    motion: (spec: unknown, timing: unknown) => quiet(() => motion(spec, timing)),
    duration: (spec: unknown, timing: unknown) => quiet(() => duration(spec, timing)),
    async close() {
      await browser.close({ silent: true });
      rmSync(bundleDir, { recursive: true, force: true });
    },
  };
}

/** Reels must be under one minute (config/brief-gate.json). Golden specs are references and exempt. */
export function lintDuration(seconds: number, golden: boolean): SpecError[] {
  const limit = (JSON.parse(readFileSync(`${REPO_ROOT}/config/brief-gate.json`, "utf8")) as { maxDurationSecondsExclusive: number })
    .maxDurationSecondsExclusive;
  if (golden || seconds < limit) return [];
  return [
    {
      code: "DURATION_EXCEEDED",
      path: "duration",
      message: `Durasi ${seconds.toFixed(2)} detik; reel wajib di bawah ${limit} detik.`,
      hint: "Potong beat atau pendekkan VO. Jangan panjangkan reel.",
    },
  ];
}

/** Rounding slack so the same text never flips between runs. */
const TOLERANCE = 0.0005;

export function lintFit(entries: readonly FitEntry[]): SpecError[] {
  const limits = JSON.parse(readFileSync(FIT_LIMITS_PATH, "utf8")) as FitLimits;
  return entries.flatMap((entry) => {
    const min = limits.minReadScale[entry.kind];
    if (entry.readScale + TOLERANCE >= min) return [];
    return [
      {
        code: "FIT_LINE_OVERFLOW",
        path: entry.path,
        message: `Teks ${entry.kind} selebar ${entry.widthPx}px, terbaca di skala ${entry.readScale.toFixed(3)}; batas Reel01 ${min.toFixed(3)}.`,
        hint: "Pendekkan copy (kata lebih sedikit atau baris lebih pendek). Jangan ubah layout.",
      },
    ];
  });
}
