/**
 * Brief gate: every reel needs an approved brief.md before any script,
 * timeline or render step may run. See docs/reels-workflow/GRILL_GATE.md.
 *
 * Approval = the creator (name + APPROVE) AND an LLM reviewer the creator
 * picked (model + APPROVE + confidence scores at or above the thresholds
 * in config/brief-gate.json). The brief body is hashed at approval time;
 * any later edit sends the reel back to draft.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

export const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
export const REELS_DIR = join(REPO_ROOT, "data", "reels");
export const TEMPLATE_PATH = join(REPO_ROOT, "docs", "templates", "brief.md");
const CONFIG_PATH = join(REPO_ROOT, "config", "brief-gate.json");

export type GateConfig = {
  /** Minimum overall confidence (0–100) the LLM reviewer must give. */
  minOverallConfidence: number;
  /** Minimum confidence (0–100) for every single interview stage. */
  minStageConfidence: number;
  /** The overall score may exceed the stage average by at most this much. */
  maxOverallAboveAverage: number;
  /** Interview stages that must each get a score. */
  stages: string[];
  /** Minimum rows in "Kalau ada yang salah" (grill stage 6 asks for three risks). */
  minRiskRows: number;
};

export type Meta = {
  id: string;
  slug: string;
  created_at: string;
  brief_status: "draft" | "approved";
  brief_hash: string | null;
  approvals: {
    creator: { name: string; date: string } | null;
    llm: { model: string; date: string; overall_confidence: number; stage_confidence: Record<string, number> } | null;
  };
  [key: string]: unknown;
};

export function loadConfig(): GateConfig {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as GateConfig;
}

export function resolveReelFolder(arg: string | undefined): string {
  if (!arg) {
    fail(["Folder reel belum disebut. Contoh: npm run check-brief -- data/reels/20261110-contoh"]);
  }
  const direct = resolve(arg);
  if (existsSync(direct)) return direct;
  const inReels = join(REELS_DIR, arg);
  if (existsSync(inReels)) return inReels;
  fail([`Folder reel tidak ditemukan: ${arg}`]);
}

export function fail(lines: string[]): never {
  console.error(lines.join("\n"));
  process.exit(1);
}

// ---------------------------------------------------------------- parsing

/** Splits brief.md into its YAML-ish frontmatter and the body. */
export function splitBrief(text: string): { front: Record<string, string>; frontRaw: string; body: string } {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { front: {}, frontRaw: "", body: text };
  const front: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^([a-z_]+):\s*(.*?)\s*(#.*)?$/);
    if (kv) front[kv[1]] = kv[2];
  }
  return { front, frontRaw: match[1], body: match[2] };
}

/** Hash of the brief body (everything after the frontmatter), whitespace-normalised at line ends. */
export function hashBody(body: string): string {
  const normalised = body.replace(/[ \t]+$/gm, "").trim();
  return createHash("sha256").update(normalised).digest("hex");
}

type Section = { title: string; lines: string[] };

function sections(body: string): Section[] {
  const out: Section[] = [];
  let current: Section | null = null;
  for (const line of body.split("\n")) {
    const h = line.match(/^##\s+(.*)$/);
    if (h) {
      current = { title: h[1].trim(), lines: [] };
      out.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return out;
}

const isBlank = (value: string) => value.trim() === "" || /\bTODO\b/i.test(value) || /^<.*>$/.test(value.trim());

function tableRows(lines: string[]): string[][] {
  const rows = lines
    .filter((l) => l.trim().startsWith("|"))
    .map((l) =>
      l
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim()),
    );
  // Drop header + separator rows.
  return rows.filter((r, i) => i > 0 && !r.every((c) => /^:?-+:?$/.test(c)));
}

// ---------------------------------------------------------------- validation

export type Problem = string;

/** Field-level completeness check. Returns human-readable problems (empty = complete). */
export function findProblems(body: string, config: GateConfig): Problem[] {
  const problems: Problem[] = [];

  const title = body.match(/^#\s+Brief:\s*(.*)$/m);
  if (!title || isBlank(title[1])) problems.push("Judul: baris '# Brief: <judul internal>' belum diisi.");

  for (const section of sections(body)) {
    // Approvals have their own, stricter check in readApprovals().
    if (/persetujuan/i.test(section.title)) continue;
    // "- Label: value" fields. Sub-headings (###) prefix the label so errors stay unambiguous.
    let sub = "";
    for (const line of section.lines) {
      const h3 = line.match(/^###\s+(.*)$/);
      if (h3) sub = `${h3[1].trim()} › `;
      const field = line.match(/^-\s+([^:]+):(.*)$/);
      if (field && isBlank(field[2])) problems.push(`${section.title} › ${sub}${field[1].trim()}: belum diisi.`);
    }

    const rows = tableRows(section.lines);
    if (section.lines.some((l) => l.trim().startsWith("|"))) {
      const isRisk = /kalau ada yang salah/i.test(section.title);
      const filled = rows.filter((r) => r.some((c) => !isBlank(c)));
      if (filled.length === 0) problems.push(`${section.title}: tabel masih kosong.`);
      if (isRisk && filled.length < config.minRiskRows) {
        problems.push(`${section.title}: minimal ${config.minRiskRows} risiko, baru ${filled.length}.`);
      }
      for (const row of rows) {
        const label = row[0] && !isBlank(row[0]) ? row[0] : "(baris tanpa nama)";
        const emptyCells = row.filter((c, i) => i > 0 && isBlank(c)).length;
        const hasAnything = row.some((c) => !isBlank(c));
        if (hasAnything && emptyCells > 0) problems.push(`${section.title} › ${label}: ${emptyCells} kolom belum diisi.`);
        if (!hasAnything && /storyline/i.test(section.title)) problems.push(`${section.title}: ada baris beat yang kosong.`);
      }
    }
  }
  return problems;
}

/** Reads approvals + confidence scores from section 9 ("Persetujuan"). */
export function readApprovals(body: string, config: GateConfig) {
  const section = sections(body).find((s) => /persetujuan/i.test(s.title));
  const problems: Problem[] = [];
  if (!section) {
    return { problems: ["Bagian '9. Persetujuan' tidak ada."], creator: null, llm: null };
  }

  const groups: Record<string, Record<string, string>> = {};
  let group = "";
  for (const line of section.lines) {
    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      group = h3[1].trim().toLowerCase();
      groups[group] = {};
    }
    const field = line.match(/^-\s+([^:]+):(.*)$/);
    if (field && group) groups[group][field[1].trim().toLowerCase()] = field[2].trim();
  }

  const creatorFields = Object.entries(groups).find(([k]) => k.includes("pembuat"))?.[1];
  const llmFields = Object.entries(groups).find(([k]) => k.includes("llm"))?.[1];
  const date = /^\d{4}-\d{2}-\d{2}$/;

  let creator: { name: string; date: string } | null = null;
  if (!creatorFields) problems.push("Persetujuan › Pembuat: bagian tidak ada.");
  else {
    if (isBlank(creatorFields["nama"] ?? "")) problems.push("Persetujuan › Pembuat › Nama: belum diisi.");
    if ((creatorFields["ketik"] ?? "") !== "APPROVE") problems.push("Persetujuan › Pembuat: belum mengetik APPROVE (persis, huruf besar).");
    if (!date.test(creatorFields["tanggal"] ?? "")) problems.push("Persetujuan › Pembuat › Tanggal: harus format YYYY-MM-DD.");
    creator = { name: creatorFields["nama"] ?? "", date: creatorFields["tanggal"] ?? "" };
  }

  let llm: NonNullable<Meta["approvals"]["llm"]> | null = null;
  if (!llmFields) problems.push("Persetujuan › Reviewer LLM: bagian tidak ada.");
  else {
    if (isBlank(llmFields["model"] ?? "")) problems.push("Persetujuan › Reviewer LLM › Model: belum diisi.");
    if ((llmFields["ketik"] ?? "") !== "APPROVE") problems.push("Persetujuan › Reviewer LLM: belum mengetik APPROVE.");
    if (!date.test(llmFields["tanggal"] ?? "")) problems.push("Persetujuan › Reviewer LLM › Tanggal: harus format YYYY-MM-DD.");

    const stageScores: Record<string, number> = {};
    for (const stage of config.stages) {
      const raw = llmFields[`confidence ${stage.toLowerCase()}`];
      const score = Number(raw);
      if (raw === undefined || raw === "" || !Number.isInteger(score) || score < 0 || score > 100) {
        problems.push(`Persetujuan › Reviewer LLM › Confidence ${stage}: harus angka bulat 0–100.`);
        continue;
      }
      stageScores[stage] = score;
      if (score < config.minStageConfidence) {
        problems.push(`Confidence ${stage} = ${score}, di bawah batas minimum ${config.minStageConfidence}. Grill ulang tahap ini.`);
      }
    }

    const overallRaw = llmFields["confidence keseluruhan"];
    const overall = Number(overallRaw);
    if (!overallRaw || !Number.isInteger(overall) || overall < 0 || overall > 100) {
      problems.push("Persetujuan › Reviewer LLM › Confidence keseluruhan: harus angka bulat 0–100.");
    } else if (overall < config.minOverallConfidence) {
      problems.push(`Confidence keseluruhan = ${overall}, di bawah batas ${config.minOverallConfidence}. Brief belum siap.`);
    } else {
      const scores = Object.values(stageScores);
      const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      if (scores.length === config.stages.length && overall > Math.round(average) + config.maxOverallAboveAverage) {
        problems.push(
          `Confidence keseluruhan ${overall} terlalu tinggi dibanding rata-rata tahap ${Math.round(average)} (maks +${config.maxOverallAboveAverage}). Jangan menggelembungkan skor.`,
        );
      }
    }
    if (isBlank(llmFields["alasan skor"] ?? "")) problems.push("Persetujuan › Reviewer LLM › Alasan skor: belum diisi.");

    llm = {
      model: llmFields["model"] ?? "",
      date: llmFields["tanggal"] ?? "",
      overall_confidence: overall,
      stage_confidence: stageScores,
    };
  }
  return { problems, creator, llm };
}

// ---------------------------------------------------------------- files

export function briefPath(folder: string) {
  return join(folder, "brief.md");
}
export function metaPath(folder: string) {
  return join(folder, "meta.json");
}

export function readMeta(folder: string): Meta | null {
  const p = metaPath(folder);
  return existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as Meta) : null;
}

export function writeMeta(folder: string, meta: Meta) {
  writeFileSync(metaPath(folder), `${JSON.stringify(meta, null, 2)}\n`);
}

/** Rewrites the frontmatter keys of brief.md in place, leaving the body untouched. */
export function setFrontmatter(folder: string, values: Record<string, string>) {
  const text = readFileSync(briefPath(folder), "utf8");
  const { frontRaw, body } = splitBrief(text);
  const lines = frontRaw.split("\n").map((line) => {
    const key = line.match(/^([a-z_]+):/)?.[1];
    if (key && key in values) {
      const comment = line.match(/\s+#.*$/)?.[0] ?? "";
      return `${key}: ${values[key]}${comment}`;
    }
    return line;
  });
  writeFileSync(briefPath(folder), `---\n${lines.join("\n")}\n---\n${body}`);
}

/**
 * Sends an approved reel back to draft after its brief changed: status,
 * meta approvals and both APPROVE lines are cleared, so it has to be
 * grilled and approved again.
 */
export function revokeApproval(folder: string, meta: Meta) {
  meta.brief_status = "draft";
  meta.brief_hash = null;
  meta.approvals = { creator: null, llm: null };
  writeMeta(folder, meta);
  setFrontmatter(folder, { brief_status: "draft", approved_by: "", approved_at: "", llm_reviewer: "", confidence: "" });
  const text = readFileSync(briefPath(folder), "utf8");
  writeFileSync(briefPath(folder), text.replace(/^(-\s+Ketik:)\s*APPROVE\s*$/gm, "$1"));
}

// ---------------------------------------------------------------- gate

export type GateResult = { ok: true; meta: Meta } | { ok: false; problems: Problem[]; revoked: boolean };

/** The single gate every pipeline step calls. Never takes a bypass option. */
export function checkBrief(folder: string): GateResult {
  const config = loadConfig();
  if (!existsSync(briefPath(folder))) return { ok: false, problems: ["brief.md tidak ada. Jalankan grill-reel dulu."], revoked: false };
  const meta = readMeta(folder);
  if (!meta) return { ok: false, problems: ["meta.json tidak ada. Buat folder reel lewat `npm run new-reel -- <slug>`."], revoked: false };

  const { front, body } = splitBrief(readFileSync(briefPath(folder), "utf8"));
  const currentHash = hashBody(body);

  if (meta.brief_status === "approved" && meta.brief_hash !== currentHash) {
    revokeApproval(folder, meta);
    return {
      ok: false,
      revoked: true,
      problems: [
        "brief.md diubah setelah disetujui (hash tidak cocok).",
        "Status otomatis dikembalikan ke draft dan kedua APPROVE dihapus.",
        "Jalankan grill-reel lagi untuk bagian yang berubah, lalu minta approve ulang.",
      ],
    };
  }

  const problems = [...findProblems(body, config), ...readApprovals(body, config).problems];
  if (meta.brief_status !== "approved") problems.push("brief_status di meta.json masih 'draft'. Setelah semua lengkap, jalankan `npm run approve-brief -- <folder>`.");
  if (front.brief_status !== "approved" && meta.brief_status === "approved") problems.push("brief_status di frontmatter brief.md tidak 'approved'.");
  if (meta.brief_status === "approved" && !meta.brief_hash) problems.push("brief_hash kosong di meta.json.");

  return problems.length ? { ok: false, problems, revoked: false } : { ok: true, meta };
}

/** Call at the top of every pipeline step. Exits the process with a clear message if the gate fails. */
export function requireApprovedBrief(folder: string, step: string): Meta {
  const result = checkBrief(folder);
  if (result.ok) return result.meta;
  fail([
    "",
    `⛔ DITOLAK: "${step}" tidak boleh jalan untuk ${relative(REPO_ROOT, folder)}`,
    "   Aturan nomor 0: tanpa brief approved, tidak ada yang jalan.",
    "",
    ...result.problems.map((p) => `   • ${p}`),
    "",
    "   Langkah: jalankan wawancara grill-reel (.claude/skills/grill-reel/SKILL.md) sampai brief lengkap,",
    "   pembuat + reviewer LLM mengetik APPROVE dengan confidence cukup, lalu `npm run approve-brief -- <folder>`.",
    "",
  ]);
}
