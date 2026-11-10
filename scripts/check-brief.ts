/**
 * npm run check-brief -- <folder>
 *
 * Pass/fail report for a reel's brief. Exit code 0 = approved and
 * unchanged since approval; 1 = anything else.
 */
import { relative } from "node:path";
import { REPO_ROOT, checkBrief, resolveReelFolder } from "./lib/brief.ts";

const folder = resolveReelFolder(process.argv[2]);
const rel = relative(REPO_ROOT, folder);
const result = checkBrief(folder);

if (result.ok) {
  const { creator, llm } = result.meta.approvals;
  console.log(`✅ LOLOS: brief ${rel} sudah approved dan tidak berubah sejak disetujui.`);
  console.log(`   Pembuat: ${creator?.name} (${creator?.date})`);
  console.log(`   Reviewer LLM: ${llm?.model} (${llm?.date}), confidence ${llm?.overall_confidence}/100`);
  process.exit(0);
}

console.error(`❌ GAGAL: brief ${rel} belum boleh masuk pipeline.${result.revoked ? " (approval dicabut)" : ""}`);
console.error("");
for (const p of result.problems) console.error(`   • ${p}`);
console.error("");
console.error(`   Total ${result.problems.length} masalah. Lanjutkan wawancara grill-reel untuk bagian di atas.`);
process.exit(1);
