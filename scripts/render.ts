/**
 * npm run render -- <folder>
 *
 * Renders one reel to out/. Gated by the brief check, with no bypass flag.
 * The render itself is Phase 3 (docs/reels-workflow/BRIEF.md) and not built yet.
 */
import { fail, requireApprovedBrief, resolveReelFolder } from "./lib/brief.ts";

const folder = resolveReelFolder(process.argv[2]);
requireApprovedBrief(folder, "render");

fail(["✅ Brief lolos gate.", "⏳ render belum dibangun (Fase 3, lihat docs/reels-workflow/STATUS.md)."]);
