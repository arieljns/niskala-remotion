/**
 * npm run reel:render -- <id> [--concurrency N]
 *
 * The only official way to render a reel. Needs state APPROVED (an approval whose hashes
 * still match every file), then re-renders the approved frames and refuses on a real
 * difference (VERIFY_DIFF), then renders out/<id>/<id>.mp4 with the fixed encoding
 * (h264, crf 18, x264 veryfast). Agents must not call `remotion render` themselves.
 */
import { readFileSync } from "node:fs";
import { CONTRACT_VERSION } from "../src/reels/contract/spec.schema.ts";
import { timingPathFor } from "./lib/check-reel.ts";
import { openFitSession } from "./lib/fit-probe.ts";
import { logState, reelContext, requireGate } from "./lib/pipeline.ts";
import { renderReel, verifyAgainstApproved, ENCODING } from "./lib/render.ts";

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith("--"));
if (!id || !/^[a-z0-9-]+$/.test(id)) {
  console.error("Pakai: npm run reel:render -- <id> [--concurrency N]");
  process.exit(1);
}
const at = args.indexOf("--concurrency");
const concurrency = at === -1 ? null : Number(args[at + 1]);

const ctx = reelContext(id);
const blocked = requireGate(ctx, "APPROVED", "reel:render", CONTRACT_VERSION);
if (blocked) {
  console.error(JSON.stringify({ ok: false, errors: [blocked] }, null, 2));
  process.exit(1);
}
const { spec } = (await import(ctx.specPath!)) as { spec: unknown };
const timing: unknown = JSON.parse(readFileSync(timingPathFor(ctx.specPath!), "utf8"));
const session = await openFitSession();
try {
  const { errors } = await verifyAgainstApproved(ctx, session, spec, timing);
  if (errors.length) {
    console.error(JSON.stringify({ ok: false, errors }, null, 2));
    process.exit(1);
  }
  console.log(
    `Frame yang di-approve cocok. Merender dengan ${ENCODING.codec} crf ${ENCODING.crf} ${ENCODING.x264Preset}...`,
  );
  const record = await renderReel(ctx, session, spec, timing, { concurrency });
  logState(ctx, CONTRACT_VERSION);
  console.log(
    `Selesai: ${record.mp4} (${(record.bytes / 1e6).toFixed(1)} MB, ${record.seconds}s, sha256 ${record.mp4Sha256.slice(0, 12)})`,
  );
} finally {
  await session.close();
}
