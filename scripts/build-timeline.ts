/**
 * npm run build-timeline -- <folder>
 *
 * script.md + transcript.json → timeline.json. Gated by the brief check.
 * The merge itself is Phase 3 (docs/reels-workflow/BRIEF.md) and not built yet.
 */
import { fail, requireApprovedBrief, resolveReelFolder } from "./lib/brief.ts";

const folder = resolveReelFolder(process.argv[2]);
requireApprovedBrief(folder, "build-timeline");

fail(["✅ Brief lolos gate.", "⏳ build-timeline belum dibangun (Fase 3, lihat docs/reels-workflow/STATUS.md)."]);
