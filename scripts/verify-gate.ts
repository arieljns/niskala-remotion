/**
 * npm run verify-gate
 *
 * Runs the brief gate end to end against a throwaway reel and prints a
 * pass/fail line per check. Cleans up after itself. Run it after any
 * change to scripts/lib/brief.ts, the brief template or the gate config.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REELS_DIR, REPO_ROOT } from "./lib/brief.ts";

const SLUG = "verify-gate-tmp";
type Run = { code: number; out: string };

function run(script: string, arg?: string): Run {
  const r = spawnSync(process.execPath, ["--no-warnings=ExperimentalWarning", join(REPO_ROOT, "scripts", script), ...(arg ? [arg] : [])], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return { code: r.status ?? 1, out: `${r.stdout}${r.stderr}` };
}

const findFolder = () => (existsSync(REELS_DIR) ? readdirSync(REELS_DIR) : []).find((d) => d.endsWith(`-${SLUG}`));
const cleanup = () => {
  const f = findFolder();
  if (f) rmSync(join(REELS_DIR, f), { recursive: true, force: true });
};

let failures = 0;
function check(name: string, ok: boolean, evidence: string) {
  if (!ok) failures++;
  console.log(`${ok ? "✅" : "❌"} ${name}`);
  console.log(evidence.trim().split("\n").map((l) => `      ${l}`).join("\n"));
  console.log("");
}

/** Replaces "- Label:" with "- Label: value" (first occurrence). */
const fill = (text: string, label: string, value: string) => text.replace(new RegExp(`^(- ${label.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}:)\\s*$`, "m"), `$1 ${value}`);

cleanup();
try {
  // 1. new-reel, then render straight away: must be refused.
  const created = run("new-reel.ts", SLUG);
  const folder = join(REELS_DIR, findFolder() ?? "missing");
  const files = readdirSync(folder).sort().join(", ");
  check("0. new-reel hanya membuat brief.md + meta.json", created.code === 0 && files === "brief.md, meta.json", `isi folder: ${files}`);

  const render = run("render.ts", folder);
  check("1. render langsung setelah new-reel → ditolak", render.code !== 0 && render.out.includes("DITOLAK"), render.out.split("\n").slice(0, 6).join("\n"));

  // 2. Partially filled brief: must fail and name the missing fields.
  const briefFile = join(folder, "brief.md");
  let brief = readFileSync(briefFile, "utf8");
  brief = brief.replace("# Brief: <judul internal>", "# Brief: Marketplace bukan rumah (uji gate)");
  brief = fill(brief, "Audiens spesifik", "Seller tumbler di Shopee, omzet ±30 jt/bln, margin tergerus biaya admin (fiktif, uji)");
  brief = fill(brief, "Hook final", "Makin laris di marketplace, makin tipis untungmu.");
  writeFileSync(briefFile, brief);
  const partial = run("check-brief.ts", folder);
  const namesFields = partial.out.includes("Satu aksi/pikiran yang diinginkan setelah menonton") && partial.out.includes("Confidence keseluruhan");
  check("2. brief sebagian → check-brief gagal dan menyebut field yang kurang", partial.code !== 0 && namesFields, partial.out.split("\n").slice(0, 8).join("\n") + "\n…");

  // 2b. Complete brief but confidence below threshold: must fail on the score.
  brief = readFileSync(join(REPO_ROOT, "scripts", "fixtures", "brief-complete.md"), "utf8").replace(/^id:.*$/m, `id: ${findFolder()}`);
  writeFileSync(briefFile, brief.replace("- Confidence keseluruhan: 86", "- Confidence keseluruhan: 72"));
  const lowScore = run("approve-brief.ts", folder);
  check("2b. confidence 72 (< 80) → approve-brief menolak", lowScore.code !== 0 && lowScore.out.includes("Confidence keseluruhan = 72"), lowScore.out.split("\n").slice(0, 4).join("\n"));

  // 2c. Overall score inflated above the stage average: must fail.
  writeFileSync(briefFile, brief.replace("- Confidence keseluruhan: 86", "- Confidence keseluruhan: 97"));
  const inflated = run("approve-brief.ts", folder);
  check("2c. confidence 97 vs rata-rata tahap 86 → ditolak (skor digelembungkan)", inflated.code !== 0 && inflated.out.includes("terlalu tinggi"), inflated.out.split("\n").slice(0, 4).join("\n"));

  // 3. Approve: check-brief must pass.
  writeFileSync(briefFile, brief);
  const approve = run("approve-brief.ts", folder);
  const approved = run("check-brief.ts", folder);
  check("3. pembuat + reviewer LLM APPROVE, confidence 86 → check-brief lolos", approve.code === 0 && approved.code === 0, `${approve.out}\n${approved.out}`);

  // 4. Change one word: hash breaks, gate fails, approval revoked.
  writeFileSync(briefFile, readFileSync(briefFile, "utf8").replace("Makin laris di marketplace", "Makin ramai di marketplace"));
  const changed = run("check-brief.ts", folder);
  const meta = JSON.parse(readFileSync(join(folder, "meta.json"), "utf8"));
  const approveLines = (readFileSync(briefFile, "utf8").match(/^- Ketik: APPROVE$/gm) ?? []).length;
  check(
    "4. ubah satu kata setelah approve → gagal, status kembali draft",
    changed.code !== 0 && changed.out.includes("hash tidak cocok") && meta.brief_status === "draft" && approveLines === 0,
    `${changed.out}\nmeta.brief_status = ${meta.brief_status} · sisa baris "Ketik: APPROVE" = ${approveLines}`,
  );

  // 4b. After revocation every gated step is blocked again.
  const blocked = run("scaffold-script.ts", folder);
  check("4b. scaffold-script setelah approval dicabut → ditolak", blocked.code !== 0 && blocked.out.includes("DITOLAK"), blocked.out.split("\n").slice(0, 3).join("\n"));
} finally {
  cleanup();
}

console.log(failures === 0 ? "SEMUA UJI LOLOS" : `${failures} UJI GAGAL`);
process.exit(failures === 0 ? 0 : 1);
