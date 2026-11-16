/**
 * npm run conformance:init -- <label>
 *
 * Creates out/conformance/<label>/ with the task, the fixture brief, and a copy of the Reel01 spec to rewrite,
 * and takes the "before" snapshot (hashes of every protected file, what git sees as changed, existing approvals)
 * that conformance:score compares against. <label> names the model, e.g. gemini-2-5-pro or claude-sonnet-5-5.
 * Run it from a clean state: do not edit the repo between init and score except through the model under test.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { REPO_ROOT } from "./lib/brief.ts";
import {
  FIXTURE_DIR,
  LABEL_RE,
  MAX_ATTEMPTS,
  approvalFiles,
  changedPaths,
  protectedHashes,
  templateFor,
  workspace,
} from "./lib/conformance.ts";

const label = process.argv[2];
if (!label || !LABEL_RE.test(label)) {
  console.error("Pakai: npm run conformance:init -- <label>   (huruf kecil, angka, tanda minus; mis. gemini-2-5-pro)");
  process.exit(1);
}
const dir = workspace(label);
if (existsSync(dir)) {
  console.error(`Sudah ada: out/conformance/${label}. Pakai label lain per percobaan (mis. ${label}-2); hasil lama tidak ditimpa.`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
const task = readFileSync(`${FIXTURE_DIR}/TASK.md`, "utf8").replaceAll("<label>", label);
writeFileSync(`${dir}/TASK.md`, task);
writeFileSync(`${dir}/brief.md`, readFileSync(`${FIXTURE_DIR}/brief-fixture.md`, "utf8"));
writeFileSync(`${dir}/spec.ts`, templateFor(label));
writeFileSync(`${dir}/template.ts`, templateFor(label));
writeFileSync(
  `${dir}/snapshot.json`,
  JSON.stringify(
    {
      takenAt: new Date().toISOString(),
      protected: protectedHashes(),
      changed: changedPaths(),
      approvals: approvalFiles(),
    },
    null,
    2,
  ) + "\n",
);

const rel = `out/conformance/${label}`;
console.log(`Workspace siap: ${rel}/

Beri model ini prompt PERSIS seperti di bawah (sama untuk semua model; jangan ditambah petunjuk), dengan akses ke repo ini:

----------------------------------------------------------------
Kerjakan tugas di ${rel}/TASK.md. Baca AGENTS.md lebih dulu. Maksimal ${MAX_ATTEMPTS} percobaan.
----------------------------------------------------------------

Setelah model selesai:  npm run conformance:score -- ${label}
Bandingkan model:       npm run conformance:compare
Repo: ${REPO_ROOT}`);
