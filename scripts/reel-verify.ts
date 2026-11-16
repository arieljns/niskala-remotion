/**
 * npm run reel:verify -- <id>
 *
 * Needs state APPROVED. Renders the same frames the human approved and compares each
 * to its approved still: identical, or within the measured render noise
 * (contract/diff-limits.json). A real difference is VERIFY_DIFF. Writes out/<id>/frames.hash.json.
 */
import { CONTRACT_VERSION } from "../src/reels/contract/spec.schema.ts";
import { timingPathFor } from "./lib/check-reel.ts";
import { openFitSession } from "./lib/fit-probe.ts";
import { reelContext, requireGate } from "./lib/pipeline.ts";
import { verifyAgainstApproved } from "./lib/render.ts";
import { readFileSync } from "node:fs";

const id = process.argv[2];
if (!id || !/^[a-z0-9-]+$/.test(id)) {
  console.error("Pakai: npm run reel:verify -- <id>");
  process.exit(1);
}
const ctx = reelContext(id);
const blocked = requireGate(ctx, "APPROVED", "reel:verify", CONTRACT_VERSION);
if (blocked) {
  console.error(JSON.stringify({ ok: false, errors: [blocked] }, null, 2));
  process.exit(1);
}
const { spec } = (await import(ctx.specPath!)) as { spec: unknown };
const timing: unknown = JSON.parse(readFileSync(timingPathFor(ctx.specPath!), "utf8"));
const session = await openFitSession();
try {
  const { errors, frames } = await verifyAgainstApproved(ctx, session, spec, timing);
  const count = (kind: string) => frames.filter((f) => f.same === kind).length;
  console.log(
    JSON.stringify(
      {
        ok: errors.length === 0,
        identical: count("identical"),
        noise: count("noise"),
        different: count("different"),
        errors,
      },
      null,
      2,
    ),
  );
  process.exit(errors.length === 0 ? 0 : 1);
} finally {
  await session.close();
}
