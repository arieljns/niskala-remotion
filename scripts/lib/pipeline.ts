/**
 * The reel state machine and the approval seal.
 *
 *   BRIEF_DRAFT > GRILLED > VO_READY > CUES_CONFIRMED > SPEC_FILLED > CHECKED
 *   > STILLS_READY > APPROVED > RENDERED > LOGGED
 *
 * State is DERIVED from evidence on disk every time; out/<id>/state.json is only
 * a log for humans, so writing to it proves nothing. A gate passes only when its
 * evidence is there and still matches the current files.
 *
 * Approval (out/<id>/APPROVED) seals hashes of everything that makes the video:
 * the spec, the brief, the assets, the kit, the contract, the checker scripts,
 * and the contact sheet the human looked at. `reel:render` recomputes them all;
 * one changed byte is APPROVAL_STALE.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import { REPO_ROOT, checkBrief, readMeta } from "./brief.ts";
import type { SpecError } from "./copy-lint.ts";
import { lintTiming } from "./timing.ts";
import { lintVo } from "./vo.ts";
import type { ReelTiming } from "../../src/reels/contract/timing-types.ts";

export const STATES = [
  "BRIEF_DRAFT",
  "GRILLED",
  "VO_READY",
  "CUES_CONFIRMED",
  "SPEC_FILLED",
  "CHECKED",
  "STILLS_READY",
  "APPROVED",
  "RENDERED",
  "LOGGED",
] as const;
export type State = (typeof STATES)[number];

export type Ctx = {
  id: string;
  root: string;
  /** A spec in specs/_golden/: a reference, exempt from the brief. */
  golden: boolean;
  specPath: string | null;
  /** data/reels/<date>-<id> for a normal reel, null for a golden one. */
  folder: string | null;
  outDir: string;
};

const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest("hex");

export function reelContext(id: string, root: string = REPO_ROOT): Ctx {
  const golden = existsSync(`${root}/src/reels/specs/_golden/${id}.ts`);
  const plain = `${root}/src/reels/specs/${id}.ts`;
  const specPath = golden ? `${root}/src/reels/specs/_golden/${id}.ts` : existsSync(plain) ? plain : null;
  let folder: string | null = null;
  const reelsDir = `${root}/data/reels`;
  if (!golden && existsSync(reelsDir)) {
    for (const name of readdirSync(reelsDir)) {
      const meta = `${reelsDir}/${name}/meta.json`;
      if (existsSync(meta) && (JSON.parse(readFileSync(meta, "utf8")) as { slug?: string }).slug === id)
        folder = `${reelsDir}/${name}`;
    }
  }
  return { id, root, golden, specPath, folder, outDir: `${root}/out/${id}` };
}

// ---------------------------------------------------------------- hashing

type Files = Record<string, string>;

function walk(root: string, dir: string, keep: (rel: string) => boolean): string[] {
  const abs = `${root}/${dir}`;
  if (!existsSync(abs)) return [];
  return readdirSync(abs).flatMap((name) => {
    const rel = `${dir}/${name}`;
    return statSync(`${root}/${rel}`).isDirectory() ? walk(root, rel, keep) : keep(rel) ? [rel] : [];
  });
}

function hashFiles(root: string, rels: string[]): Files {
  const files: Files = {};
  for (const rel of [...new Set(rels)].sort())
    if (existsSync(`${root}/${rel}`)) files[rel] = sha256(readFileSync(`${root}/${rel}`));
  return files;
}

const isCode = (rel: string) => /\.(ts|tsx)$/.test(rel);
/** Directories under src/reels that are not the kit: specs and contract are sealed on their own, other reels do not render this one. */
const NOT_KIT = ["src/reels/specs/", "src/reels/contract/", "src/reels/reel02/", "src/reels/reel03/"];
/**
 * What the kit reads at render time: Reel01's voice-over, the fonts, the product images and the shared
 * manifest. A reel's own VO folder is added from its timing sidecar.
 */
const ASSET_DIRS = [
  "public/reels/vo_reels_1_el",
  "public/fonts",
  "public/reels/reel01-pack/reel01/products",
  "public/reels/_shared",
];

function ownVoDir(ctx: Ctx): string[] {
  const timingPath = ctx.specPath?.replace(/\.ts$/, ".timing.json");
  if (!timingPath || !existsSync(timingPath)) return [];
  const voDir = (JSON.parse(readFileSync(timingPath, "utf8")) as { voDir?: string }).voDir;
  return voDir ? [`public/${voDir}`] : [];
}

export type Binding = {
  contractVersion: string;
  groups: { spec: Files; brief: Files; assets: Files; kit: Files; contract: Files; checker: Files; evidence: Files };
};

export function digestOf(files: Files): string {
  return sha256(
    Object.entries(files)
      .map(([path, hash]) => `${path}:${hash}`)
      .join("\n"),
  );
}

/** Everything the approval seals, read from disk now. */
export function collectBinding(ctx: Ctx, contractVersion: string): Binding {
  const { root } = ctx;
  const rel = (p: string) => relative(root, p);
  const kitFiles = [
    ...walk(root, "src/reels", (r) => isCode(r) && !NOT_KIT.some((prefix) => r.startsWith(prefix))),
    ...walk(root, "src/theme", isCode),
    "src/index.ts",
    "src/Root.tsx",
    "remotion.config.ts",
    "package-lock.json",
  ];
  const meta = ctx.folder ? readMeta(ctx.folder) : null;
  return {
    contractVersion,
    groups: {
      spec: hashFiles(
        root,
        ctx.specPath ? [rel(ctx.specPath), rel(ctx.specPath.replace(/\.ts$/, ".timing.json"))] : [],
      ),
      brief: ctx.folder && meta?.brief_hash ? { "brief.md": meta.brief_hash } : {},
      assets: hashFiles(
        root,
        [...ASSET_DIRS, ...ownVoDir(ctx)].flatMap((dir) =>
          walk(root, dir, (r) => !r.split("/").at(-1)!.startsWith(".")),
        ),
      ),
      kit: hashFiles(root, kitFiles),
      contract: hashFiles(
        root,
        walk(root, "src/reels/contract", () => true),
      ),
      checker: hashFiles(root, [
        ...walk(root, "scripts/lib", isCode),
        ...walk(root, "scripts", (r) => /scripts\/(reel-[a-z-]+|render)\.ts$/.test(r)),
      ]),
      evidence: hashFiles(
        root,
        ["contact.png", "stills.json"].map((f) => rel(`${ctx.outDir}/${f}`)),
      ),
    },
  };
}

function diffFiles(group: string, sealed: Files, now: Files): SpecError | null {
  const changed = [
    ...Object.keys(now)
      .filter((p) => sealed[p] !== undefined && sealed[p] !== now[p])
      .map((p) => `${p} (berubah)`),
    ...Object.keys(now)
      .filter((p) => sealed[p] === undefined)
      .map((p) => `${p} (baru)`),
    ...Object.keys(sealed)
      .filter((p) => now[p] === undefined)
      .map((p) => `${p} (hilang)`),
  ];
  if (changed.length === 0) return null;
  return {
    code: "APPROVAL_STALE",
    path: group,
    message: `${changed.length} berkas di grup "${group}" berbeda dari saat di-approve: ${changed.slice(0, 8).join(", ")}${changed.length > 8 ? ", ..." : ""}.`,
    hint: "Tinjau lagi contact sheet, lalu reel:approve ulang. Approval hanya berlaku untuk isi persis yang dilihat manusia.",
  };
}

// ---------------------------------------------------------------- artifacts

export type Approval = { version: 1; id: string; approvedBy: string; approvedAt: string; binding: Binding };

export const approvalPath = (ctx: Ctx) => `${ctx.outDir}/APPROVED`;

export function writeApproval(ctx: Ctx, approvedBy: string, contractVersion: string, now = new Date()): Approval {
  const approval: Approval = {
    version: 1,
    id: ctx.id,
    approvedBy,
    approvedAt: now.toISOString(),
    binding: collectBinding(ctx, contractVersion),
  };
  mkdirSync(ctx.outDir, { recursive: true });
  writeFileSync(approvalPath(ctx), JSON.stringify(approval, null, 2) + "\n");
  return approval;
}

/** [] = the approval still matches everything on disk. */
export function verifyApproval(ctx: Ctx, contractVersion: string): SpecError[] {
  if (!existsSync(approvalPath(ctx))) {
    return [
      {
        code: "APPROVAL_MISSING",
        path: "",
        message: `Belum ada approval untuk "${ctx.id}" (out/${ctx.id}/APPROVED tidak ada).`,
        hint: "Jalankan reel:check, reel:stills, lalu minta manusia menjalankan reel:approve setelah melihat contact sheet.",
      },
    ];
  }
  const approval = JSON.parse(readFileSync(approvalPath(ctx), "utf8")) as Approval;
  const now = collectBinding(ctx, contractVersion);
  const errors: SpecError[] = [];
  if (approval.binding.contractVersion !== contractVersion) {
    errors.push({
      code: "APPROVAL_STALE",
      path: "contractVersion",
      message: `Di-approve pada kontrak ${approval.binding.contractVersion}, sekarang ${contractVersion}.`,
      hint: "Approve ulang.",
    });
  }
  for (const group of Object.keys(now.groups) as (keyof Binding["groups"])[]) {
    const error = diffFiles(group, approval.binding.groups[group] ?? {}, now.groups[group]);
    if (error) errors.push(error);
  }
  return errors;
}

// ---------------------------------------------------------------- check and stills records

export type CheckRecord = { ok: boolean; at: string; digests: Record<"spec" | "kit" | "contract" | "checker", string> };

export function digestsNow(ctx: Ctx, contractVersion: string): CheckRecord["digests"] {
  const { groups } = collectBinding(ctx, contractVersion);
  return {
    spec: digestOf(groups.spec),
    kit: digestOf(groups.kit),
    contract: digestOf(groups.contract),
    checker: digestOf(groups.checker),
  };
}

export function recordCheck(ctx: Ctx, ok: boolean, contractVersion: string, now = new Date()) {
  mkdirSync(ctx.outDir, { recursive: true });
  const record: CheckRecord = { ok, at: now.toISOString(), digests: digestsNow(ctx, contractVersion) };
  writeFileSync(`${ctx.outDir}/check.json`, JSON.stringify(record, null, 2) + "\n");
}

function readJson<T>(path: string): T | null {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : null;
}

// ---------------------------------------------------------------- state

export type Gate = { state: State; ok: boolean; note: string };

/** Walks every gate against the evidence on disk. */
export function deriveGates(ctx: Ctx, contractVersion: string): Gate[] {
  const gate = (state: State, ok: boolean, note: string): Gate => ({ state, ok, note });

  const brief = ctx.golden ? null : ctx.folder ? checkBrief(ctx.folder) : null;
  const check = readJson<CheckRecord>(`${ctx.outDir}/check.json`);
  const now = check || existsSync(`${ctx.outDir}/stills.json`) ? digestsNow(ctx, contractVersion) : null;
  const checked =
    !!check?.ok && !!now && (Object.keys(now) as (keyof typeof now)[]).every((k) => now[k] === check.digests[k]);
  const stills = readJson<{ specDigest: string; kitDigest: string; contactHash: string }>(`${ctx.outDir}/stills.json`);
  const contact = `${ctx.outDir}/contact.png`;
  const stillsOk =
    !!stills &&
    !!now &&
    existsSync(contact) &&
    stills.specDigest === now.spec &&
    stills.kitDigest === now.kit &&
    stills.contactHash === sha256(readFileSync(contact));
  // Voice-over and cues: golden specs carry Reel01's legacy recording; every other reel needs its own, prepared and confirmed.
  const timingPath = ctx.specPath?.replace(/\.ts$/, ".timing.json") ?? null;
  const timing =
    timingPath && existsSync(timingPath) ? (JSON.parse(readFileSync(timingPath, "utf8")) as ReelTiming) : null;
  const cuesPath = `${ctx.outDir}/cues.json`;
  const timingErrors = timing
    ? lintTiming(timing, {
        root: ctx.root,
        golden: ctx.golden,
        cuesText: existsSync(cuesPath) ? readFileSync(cuesPath, "utf8") : null,
      })
    : [];
  const voErrors = timing && !ctx.golden ? lintVo(`${ctx.root}/public/${timing.voDir}`) : [];
  const voReady = !timing
    ? { ok: false, note: "belum ada <id>.timing.json: rekam VO, reel:vo-prep, reel:cues" }
    : ctx.golden
      ? {
          ok: !timingErrors.some((e) => e.code === "VO_MISSING"),
          note: "rekaman legacy Reel01 (dikecualikan dari vo-prep)",
        }
      : voErrors.length || timingErrors.some((e) => e.code === "VO_MISSING")
        ? {
            ok: false,
            note: `VO belum siap: ${[...voErrors, ...timingErrors.filter((e) => e.code === "VO_MISSING")]
              .map((e) => e.code + " " + e.path)
              .slice(0, 3)
              .join("; ")}`,
          }
        : { ok: true, note: "14 rekaman sudah lewat reel:vo-prep" };
  const cueProblems = timingErrors.filter((e) => e.code !== "VO_MISSING");
  const cuesConfirmed = !timing
    ? { ok: false, note: "belum ada timing" }
    : cueProblems.length
      ? {
          ok: false,
          note: `timing belum sah: ${cueProblems
            .map((e) => e.code + " " + e.path)
            .slice(0, 3)
            .join("; ")}`,
        }
      : {
          ok: true,
          note: ctx.golden ? "timing legacy Reel01 (spec golden)" : `dikonfirmasi oleh ${timing.confirmedBy}`,
        };
  // Rendered: the MP4 on disk is the one reel:render made, from the approval that is still valid.
  const renderRecord = readJson<{ mp4: string; mp4Sha256: string; approvalSha256: string }>(
    `${ctx.outDir}/render.json`,
  );
  const mp4Path = `${ctx.outDir}/${ctx.id}.mp4`;
  const rendered = (() => {
    if (!renderRecord || !existsSync(mp4Path))
      return { ok: false, note: "belum dirender: npm run reel:render -- <id>" };
    if (sha256(readFileSync(mp4Path)) !== renderRecord.mp4Sha256)
      return { ok: false, note: "MP4 di disk berbeda dari yang dicatat reel:render" };
    if (!existsSync(approvalPath(ctx))) return { ok: false, note: "approval hilang" };
    if (sha256(readFileSync(approvalPath(ctx))) !== renderRecord.approvalSha256)
      return { ok: false, note: "dirender dari approval yang lain; render ulang" };
    if (verifyApproval(ctx, contractVersion).length)
      return { ok: false, note: "approval usang sejak render; approve dan render ulang" };
    return { ok: true, note: `${renderRecord.mp4} cocok dengan approval yang berlaku` };
  })();
  const approvalErrors = existsSync(approvalPath(ctx)) ? verifyApproval(ctx, contractVersion) : null;

  return [
    gate(
      "BRIEF_DRAFT",
      ctx.golden || !!ctx.folder,
      ctx.golden
        ? "spec golden: tanpa brief"
        : ctx.folder
          ? "folder brief ada"
          : "belum ada folder brief: npm run reel:grill -- <id>",
    ),
    gate(
      "GRILLED",
      ctx.golden || !!brief?.ok,
      ctx.golden
        ? "dikecualikan (spec golden)"
        : brief?.ok
          ? "brief approved dan tidak berubah"
          : "brief belum approved: grill-reel lalu approve-brief",
    ),
    gate("VO_READY", voReady.ok, voReady.note),
    gate("CUES_CONFIRMED", cuesConfirmed.ok, cuesConfirmed.note),
    gate("SPEC_FILLED", !!ctx.specPath, ctx.specPath ? "spec ada" : "belum ada src/reels/specs/<id>.ts"),
    gate(
      "CHECKED",
      checked,
      checked
        ? "reel:check lolos untuk isi sekarang"
        : check
          ? "reel:check gagal atau isinya berubah sejak itu"
          : "belum dijalankan: npm run reel:check -- <id>",
    ),
    gate(
      "STILLS_READY",
      stillsOk,
      stillsOk ? "contact sheet cocok dengan isi sekarang" : "belum ada atau sudah usang: npm run reel:stills -- <id>",
    ),
    gate(
      "APPROVED",
      approvalErrors !== null && approvalErrors.length === 0,
      approvalErrors === null
        ? "belum di-approve: manusia menjalankan npm run reel:approve -- <id>"
        : approvalErrors.length
          ? `usang: ${approvalErrors.map((e) => e.path).join(", ")}`
          : "approval cocok dengan isi sekarang",
    ),
    gate("RENDERED", rendered.ok, rendered.note),
    gate("LOGGED", false, "Konten Log ditunda (STATUS.md)"),
  ];
}

/** The furthest state reached with every earlier gate passed. */
export function currentState(gates: Gate[]): State {
  let reached: State = "BRIEF_DRAFT";
  for (const g of gates) {
    if (!g.ok) break;
    reached = g.state;
  }
  return reached;
}

/** A command that needs `needed` refuses to run unless every gate up to it passes. Returns an error or null. */
export function requireGate(ctx: Ctx, needed: State, command: string, contractVersion: string): SpecError | null {
  const gates = deriveGates(ctx, contractVersion);
  const upTo = gates.slice(0, STATES.indexOf(needed) + 1);
  const blocked = upTo.find((g) => !g.ok);
  if (!blocked) return null;
  return {
    code: "GATE_NOT_PASSED",
    path: blocked.state,
    message: `${command} butuh state ${needed}, tapi gerbang ${blocked.state} belum lolos: ${blocked.note}.`,
    hint: "Selesaikan gerbang itu dulu. Tidak ada flag untuk melewatinya.",
  };
}

export function logState(ctx: Ctx, contractVersion: string, now = new Date()) {
  const gates = deriveGates(ctx, contractVersion);
  mkdirSync(ctx.outDir, { recursive: true });
  const path = `${ctx.outDir}/state.json`;
  const previous = readJson<{ history?: { state: State; at: string }[] }>(path);
  const state = currentState(gates);
  const history = previous?.history ?? [];
  if (history.at(-1)?.state !== state) history.push({ state, at: now.toISOString() });
  writeFileSync(
    path,
    JSON.stringify(
      { id: ctx.id, note: "Log untuk manusia. Gerbang selalu dihitung ulang dari bukti di disk.", state, history },
      null,
      2,
    ) + "\n",
  );
  return { gates, state };
}

export const sha256Of = sha256;
