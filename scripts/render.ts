/**
 * npm run render -- <folder>
 *
 * Renders one reel to out/. Gated by the brief check, with no bypass flag.
 * Also needs the pipeline state APPROVED: check, stills and a human approval whose
 * hashes still match (APPROVAL_STALE otherwise). The render itself is scripts/reel-render.ts.
 */
import { spawnSync } from "node:child_process";
import { fail, requireApprovedBrief, resolveReelFolder } from "./lib/brief.ts";
import { CONTRACT_VERSION } from "../src/reels/contract/spec.schema.ts";
import { reelContext, requireGate } from "./lib/pipeline.ts";

const folder = resolveReelFolder(process.argv[2]);
const meta = requireApprovedBrief(folder, "render");

// Every gate up to APPROVED must hold, and the approval must still match the files on disk.
const blocked = requireGate(reelContext(meta.slug), "APPROVED", "render", CONTRACT_VERSION);
if (blocked) {
  fail(["", `⛔ DITOLAK [${blocked.code}] ${blocked.message}`, `   ${blocked.hint}`, ""]);
}

// Brief and approval hold: hand over to the one official render.
const run = spawnSync("node", ["--no-warnings=ExperimentalWarning", `${import.meta.dirname}/reel-render.ts`, meta.slug], {
  stdio: "inherit",
});
process.exit(run.status ?? 1);
