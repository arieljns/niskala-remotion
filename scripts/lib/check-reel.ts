/**
 * The whole check for one reel, shared by `reel:check` and the tests: contract
 * and copy lint, brief gate, fit and motion measured in a browser, and the
 * non-determinism scan over the kit.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CONTRACT_VERSION } from "../../src/reels/contract/spec.schema.ts";
import type { MotionMetrics } from "../../src/reels/contract/motion-types.ts";
import { REELS_DIR, REPO_ROOT, checkBrief } from "./brief.ts";
import { checkSpec } from "./check-spec.ts";
import { numbersFromBrief, type SpecError } from "./copy-lint.ts";
import { lintDuration, lintFit, type openFitSession } from "./fit-probe.ts";
import { checkAssets } from "./assets.ts";
import { lintMotion } from "./motion-lint.ts";
import { lintTiming } from "./timing.ts";
import { lintVo } from "./vo.ts";
import type { ReelTiming } from "../../src/reels/contract/timing-types.ts";

export type Session = Awaited<ReturnType<typeof openFitSession>>;
export type CheckResult = {
  ok: boolean;
  id: string;
  contractVersion: string;
  /** Checks this reel is exempt from, and why it is allowed (golden specs only). */
  exempt: string[];
  errors: SpecError[];
  metrics: MotionMetrics | null;
};

const SPECS_DIR = `${REPO_ROOT}/src/reels/specs`;

/** A spec in specs/_golden/ is a reference, not a posted reel: no brief. Only humans may put files there (Stage G guards it). */
export function locateSpec(id: string): { path: string; golden: boolean } | null {
  if (existsSync(`${SPECS_DIR}/_golden/${id}.ts`)) return { path: `${SPECS_DIR}/_golden/${id}.ts`, golden: true };
  if (existsSync(`${SPECS_DIR}/${id}.ts`)) return { path: `${SPECS_DIR}/${id}.ts`, golden: false };
  return null;
}

/** The timing sidecar sits next to the spec: <id>.timing.json. */
export const timingPathFor = (specPath: string) => specPath.replace(/\.ts$/, ".timing.json");

export function findBriefFolder(slug: string): string | null {
  if (!existsSync(REELS_DIR)) return null;
  for (const name of readdirSync(REELS_DIR)) {
    const meta = `${REELS_DIR}/${name}/meta.json`;
    if (existsSync(meta) && (JSON.parse(readFileSync(meta, "utf8")) as { slug?: string }).slug === slug) {
      return `${REELS_DIR}/${name}`;
    }
  }
  return null;
}

/** Brief gate for a non-golden reel: returns the numbers its brief allows, or the error. */
export function briefGate(id: string): { numbers: Set<string> | null; errors: SpecError[] } {
  const folder = findBriefFolder(id);
  const brief = folder ? checkBrief(folder) : null;
  if (!folder || !brief?.ok) {
    return {
      numbers: null,
      errors: [
        {
          code: "BRIEF_NOT_APPROVED",
          path: "",
          message: folder
            ? "Brief reel ini belum approved atau berubah sejak approval."
            : `Tidak ada folder brief dengan slug "${id}" di data/reels/.`,
          hint: "Jalankan wawancara grill-reel, lalu npm run approve-brief.",
        },
      ],
    };
  }
  return { numbers: numbersFromBrief(readFileSync(`${folder}/brief.md`, "utf8")), errors: [] };
}

const NON_DETERMINISTIC = /\b(Math\.random|Date\.now|new Date|fetch)\s*\(/g;

/** Strips comments and string contents so a mention in text is not flagged, only real calls. */
const codeOnly = (text: string) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, "")
    .replace(/(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g, (m) => m[0] + " ".repeat(Math.max(0, m.length - 2)) + m[0]);

export function scanNondeterminism(files: { path: string; text: string }[]): SpecError[] {
  const errors: SpecError[] = [];
  for (const { path, text } of files) {
    codeOnly(text)
      .split("\n")
      .forEach((line, index) => {
        for (const match of line.matchAll(NON_DETERMINISTIC)) {
          errors.push({
            code: "NONDETERMINISTIC_API",
            path: `${path}:${index + 1}`,
            message: `${match[1]}() membuat render tidak identik antar jalan.`,
            hint: "Pakai random(seed) dari remotion, konstanta, atau file lokal.",
          });
        }
      });
  }
  return errors;
}

export function kitFiles(dir = `${REPO_ROOT}/src/reels`): { path: string; text: string }[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return kitFiles(full);
    return /\.(ts|tsx)$/.test(name)
      ? [{ path: full.replace(`${REPO_ROOT}/`, ""), text: readFileSync(full, "utf8") }]
      : [];
  });
}

/** A thrown layout error ("3 words but 4 word times") becomes a clean code instead of a crash. */
export function translateProbeError(error: unknown): SpecError {
  const message = error instanceof Error ? error.message : String(error);
  const timing =
    /([A-Za-z0-9 ]+): (\d+) words but (\d+) word times/.exec(message) ?? /Phrase (\d+) has no timing/.exec(message);
  if (timing) {
    return {
      code: "WORD_TIMING_MISMATCH",
      path: timing[1]?.trim() ?? "",
      message: timing[0],
      hint: "Jumlah kata frasa harus sama dengan frasa yang sama di spec golden Reel01 (timing masih terkunci ke rekaman VO Reel01).",
    };
  }
  throw error;
}

export async function checkReel(id: string, session: Session): Promise<CheckResult> {
  const located = locateSpec(id);
  const result: CheckResult = {
    ok: false,
    id,
    contractVersion: CONTRACT_VERSION,
    exempt: [],
    errors: [],
    metrics: null,
  };
  if (!located) {
    // Rule 0 first: a reel without an approved brief is blocked before anything about its spec.
    result.errors.push(...briefGate(id).errors);
    result.errors.push({
      code: "SCHEMA_INVALID",
      path: "",
      message: `Tidak ada spec untuk "${id}" di src/reels/specs/.`,
      hint: "Buat src/reels/specs/<id>.ts dengan ekspor bernama `spec`.",
    });
    return result;
  }

  let allowedNumbers: Set<string> | null = null;
  if (located.golden) {
    result.exempt.push("brief", "numbers");
  } else {
    const gate = briefGate(id);
    result.errors.push(...gate.errors);
    allowedNumbers = gate.numbers;
  }

  const { spec } = (await import(located.path)) as { spec: unknown };
  result.errors.push(...checkSpec(spec, allowedNumbers));
  const timingPath = timingPathFor(located.path);
  if (!existsSync(timingPath)) {
    result.errors.push({
      code: "TIMING_MISSING",
      path: timingPath.replace(`${REPO_ROOT}/`, ""),
      message: `Tidak ada berkas timing untuk "${id}".`,
      hint: "Rekam VO, jalankan reel:vo-prep lalu reel:cues; manusia mengonfirmasi hasilnya. Timing tidak boleh diketik tangan.",
    });
  }
  const timing: unknown = existsSync(timingPath) ? JSON.parse(readFileSync(timingPath, "utf8")) : null;
  result.errors.push(...checkAssets());
  if (timing) {
    const cuesPath = `${REPO_ROOT}/out/${id}/cues.json`;
    const cuesText = existsSync(cuesPath) ? readFileSync(cuesPath, "utf8") : null;
    result.errors.push(...lintTiming(timing as ReelTiming, { golden: located.golden, cuesText }));
    // A reel's own recordings must have gone through reel:vo-prep. Reel01's legacy files predate it and are exempt.
    if ((timing as ReelTiming).source === "cues") {
      result.errors.push(...lintVo(`${REPO_ROOT}/public/${(timing as ReelTiming).voDir}`));
    }
  }
  result.errors.push(...scanNondeterminism(kitFiles()));

  // Browser checks need a spec that passes the contract and the copy lint.
  if (!result.errors.some((e) => e.code !== "BRIEF_NOT_APPROVED" && e.code !== "NONDETERMINISTIC_API")) {
    try {
      result.errors.push(...lintFit(await session.measure(spec, timing)));
      const motion = await session.motion(spec, timing);
      result.metrics = motion.metrics;
      result.errors.push(...lintMotion(motion));
      result.errors.push(...lintDuration(await session.duration(spec, timing), located.golden));
    } catch (error) {
      result.errors.push(translateProbeError(error));
    }
  }
  result.ok = result.errors.length === 0;
  return result;
}
