/**
 * npm run reel:approve -- <id>
 *
 * Only a human runs this, in their own terminal, after looking at
 * out/<id>/contact.png. Needs state STILLS_READY. It asks you to type your name
 * and APPROVE, then seals hashes of everything that makes the video
 * (out/<id>/APPROVED). Any later change to those files makes the approval
 * stale (APPROVAL_STALE) and the render refuses to run.
 *
 * There is no flag to skip the prompt, and without a terminal it refuses.
 * Agents must not run it, create the file, or edit it.
 */
import { createInterface } from "node:readline/promises";
import { readMeta } from "./lib/brief.ts";
import { CONTRACT_VERSION } from "../src/reels/contract/spec.schema.ts";
import { logState, reelContext, requireGate, writeApproval } from "./lib/pipeline.ts";

const id = process.argv[2];
if (!id || !/^[a-z0-9-]+$/.test(id)) {
  console.error("Pakai: npm run reel:approve -- <id>");
  process.exit(1);
}
const ctx = reelContext(id);
const blocked = requireGate(ctx, "STILLS_READY", "reel:approve", CONTRACT_VERSION);
if (blocked) {
  console.error(JSON.stringify({ ok: false, errors: [blocked] }, null, 2));
  process.exit(1);
}
if (!process.stdin.isTTY) {
  console.error(
    "reel:approve harus dijalankan manusia di terminalnya sendiri (stdin bukan terminal). Agent tidak boleh meng-approve.",
  );
  process.exit(1);
}

const creator = ctx.folder ? (readMeta(ctx.folder)?.approvals.creator?.name ?? null) : null;
console.log(`Buka out/${id}/contact.png dan periksa semua frame dan laporan gerak di out/${id}/stills.json.`);
const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = (
  await rl.question(`Ketik nama kamu${creator ? ` (harus "${creator}", pembuat di brief)` : ""} lalu APPROVE: `)
).trim();
rl.close();

const match = /^(.*\S)\s+APPROVE$/.exec(answer);
if (!match) {
  console.error(
    'Format salah. Ketik nama lalu kata APPROVE persis (huruf besar), mis. "Ariel APPROVE". "ok" atau "lanjut" bukan persetujuan.',
  );
  process.exit(1);
}
if (creator && match[1].toLowerCase() !== creator.toLowerCase()) {
  console.error(`Nama harus pembuat reel di brief ("${creator}"), bukan "${match[1]}".`);
  process.exit(1);
}

writeApproval(ctx, match[1], CONTRACT_VERSION);
logState(ctx, CONTRACT_VERSION);
console.log(
  `Di-approve oleh ${match[1]}. Isi yang disegel: spec, brief, aset, kit, kontrak, pemeriksa, contact sheet.`,
);
console.log("Mengubah satu berkas pun di dalamnya membatalkan approval (APPROVAL_STALE).");
