/**
 * npm run approve-brief -- <folder>
 *
 * Seals a brief once the creator AND the LLM reviewer have typed APPROVE
 * in section 9 with confidence at or above config/brief-gate.json.
 * Writes brief_status, approvals and brief_hash to meta.json and mirrors
 * the status into brief.md's frontmatter. Refuses if anything is missing.
 */
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import {
  REPO_ROOT,
  briefPath,
  fail,
  findProblems,
  hashBody,
  loadConfig,
  readApprovals,
  readMeta,
  resolveReelFolder,
  setFrontmatter,
  splitBrief,
  writeMeta,
} from "./lib/brief.ts";

const folder = resolveReelFolder(process.argv[2]);
const rel = relative(REPO_ROOT, folder);
const config = loadConfig();
const meta = readMeta(folder);
if (!meta) fail([`meta.json tidak ada di ${rel}.`]);

const { body } = splitBrief(readFileSync(briefPath(folder), "utf8"));
const approvals = readApprovals(body, config);
const problems = [...findProblems(body, config), ...approvals.problems];

if (problems.length || !approvals.creator || !approvals.llm) {
  fail([
    `❌ Belum bisa di-approve: ${rel}`,
    "",
    ...problems.map((p) => `   • ${p}`),
    "",
    "   Status tetap draft.",
  ]);
}

meta.brief_status = "approved";
meta.approvals = { creator: approvals.creator, llm: approvals.llm };
setFrontmatter(folder, {
  brief_status: "approved",
  approved_by: approvals.creator.name,
  approved_at: approvals.creator.date,
  llm_reviewer: approvals.llm.model,
  confidence: String(approvals.llm.overall_confidence),
});
// Hash after the frontmatter write: only the body is hashed, so this is stable.
meta.brief_hash = hashBody(splitBrief(readFileSync(briefPath(folder), "utf8")).body);
writeMeta(folder, meta);

console.log(`✅ Brief approved: ${rel}`);
console.log(`   Pembuat: ${approvals.creator.name} · Reviewer LLM: ${approvals.llm.model} · confidence ${approvals.llm.overall_confidence}/100`);
console.log("   Pipeline sekarang boleh jalan: scaffold-script → build-timeline → render.");
console.log("   Kalau brief.md diubah sedikit pun, approval otomatis dicabut.");
