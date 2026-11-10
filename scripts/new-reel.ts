/**
 * npm run new-reel -- <slug>
 *
 * Creates data/reels/<YYYYMMDD-slug>/ with ONLY brief.md (draft) and
 * meta.json. script.md is not scaffolded here: that waits for an approved
 * brief (npm run scaffold-script).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { REELS_DIR, REPO_ROOT, TEMPLATE_PATH, fail, writeMeta, type Meta } from "./lib/brief.ts";

const slug = process.argv[2];
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  fail(["Pakai: npm run new-reel -- <slug>", "Slug huruf kecil, angka, dan tanda minus saja. Contoh: marketplace-bukan-rumah"]);
}

const now = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
const id = `${date}-${slug}`;
const folder = join(REELS_DIR, id);

if (existsSync(folder)) fail([`Folder sudah ada: ${relative(REPO_ROOT, folder)}`]);
mkdirSync(folder, { recursive: true });

const brief = readFileSync(TEMPLATE_PATH, "utf8").replace(/^id:.*$/m, `id: ${id}`);
writeFileSync(join(folder, "brief.md"), brief);

const meta: Meta = {
  id,
  slug,
  created_at: now.toISOString(),
  brief_status: "draft",
  brief_hash: null,
  approvals: { creator: null, llm: null },
};
writeMeta(folder, meta);

const rel = relative(REPO_ROOT, folder);
console.log(`✅ Folder reel dibuat: ${rel}/`);
console.log("   Isinya cuma brief.md (draft) dan meta.json.");
console.log("");
console.log("Langkah berikutnya: jalankan wawancara grill-reel untuk mengisi brief.md.");
console.log("   Claude Code: ketik /grill-reel   ·   agent lain: baca .claude/skills/grill-reel/SKILL.md");
console.log(`   Setelah pembuat + reviewer LLM mengetik APPROVE: npm run approve-brief -- ${rel}`);
