/**
 * npm run scaffold-script -- <folder>
 *
 * Writes the script.md beat sheet for a reel. Gated: refuses unless the
 * brief is approved and unchanged.
 */
import { existsSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { REPO_ROOT, fail, requireApprovedBrief, resolveReelFolder } from "./lib/brief.ts";

const folder = resolveReelFolder(process.argv[2]);
const meta = requireApprovedBrief(folder, "scaffold-script");

const target = join(folder, "script.md");
if (existsSync(target)) fail([`script.md sudah ada: ${relative(REPO_ROOT, target)}`]);

writeFileSync(
  target,
  `# ${meta.id}
template: TODO
tema: senja

[HOOK]    TODO teks VO hook          | scene: kinetic
[ALASAN]  TODO teks VO alasan 1      | scene: TODO | data: TODO
[ALASAN]  TODO teks VO alasan 2      | scene: TODO | data: TODO
[SOLUSI]  TODO teks VO solusi        | scene: TODO | data: TODO
[CTA]     TODO teks VO penutup       | scene: endcard
`,
);
console.log(`✅ script.md dibuat: ${relative(REPO_ROOT, target)}`);
console.log("   Isi tiap beat sesuai brief.md (bagian 3 Storyline dan 5 Rencana visual).");
