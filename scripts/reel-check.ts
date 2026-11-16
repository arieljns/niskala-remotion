/**
 * npm run reel:check -- <id> [--json]
 * npm run reel:check -- --explain <CODE>
 *
 * Runs every check on src/reels/specs/<id>.ts (or specs/_golden/<id>.ts):
 * contract, copy lint, brief gate, fit and motion measured in a real browser,
 * and the non-determinism scan. Each error is {code, path, message, hint},
 * written for an LLM to act on. `--explain` says what a code means and how to
 * fix it. Exit 0 = ok, 1 = errors.
 */
import { readFileSync } from "node:fs";
import { REPO_ROOT } from "./lib/brief.ts";
import { checkReel } from "./lib/check-reel.ts";
import { openFitSession } from "./lib/fit-probe.ts";
import { recordCheck, reelContext } from "./lib/pipeline.ts";
import { CONTRACT_VERSION } from "../src/reels/contract/spec.schema.ts";

type Catalog = Record<
  string,
  { enforced: boolean; stage: string; summary: string; why: string; fix: string; example?: string }
>;
const args = process.argv.slice(2);
const catalog = JSON.parse(readFileSync(`${REPO_ROOT}/src/reels/contract/errors.json`, "utf8")) as Catalog;

const explainAt = args.indexOf("--explain");
if (explainAt !== -1) {
  const code = (args[explainAt + 1] ?? "").toUpperCase();
  const entry = catalog[code];
  if (!entry) {
    console.error(
      `Kode tidak dikenal: "${code}". Kode yang ada: ${Object.keys(catalog)
        .filter((k) => !k.startsWith("_"))
        .join(", ")}`,
    );
    process.exit(1);
  }
  console.log(JSON.stringify({ code, ...entry }, null, 2));
  process.exit(0);
}

const id = args.find((arg) => !arg.startsWith("--"));
if (!id || !/^[a-z0-9-]+$/.test(id)) {
  console.error("Pakai: npm run reel:check -- <id> [--json]   atau   npm run reel:check -- --explain <KODE>");
  process.exit(1);
}

const session = await openFitSession();
let result;
try {
  result = await checkReel(id, session);
} finally {
  await session.close();
}

// Remember the outcome for the state machine (CHECKED gate). Only a real spec has an outcome to remember.
if (reelContext(id).specPath) recordCheck(reelContext(id), result.ok, CONTRACT_VERSION);

if (args.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(
    `LOLOS ${id} (kontrak ${result.contractVersion}${result.exempt.length ? `, dikecualikan: ${result.exempt.join(", ")}` : ""})`,
  );
  if (result.metrics)
    console.log(
      `  gerak: hold terpendek ${result.metrics.minHoldFrames} f, maks ${result.metrics.maxConcurrentEntrances} kata masuk bersamaan`,
    );
} else {
  console.log(`GAGAL ${id}: ${result.errors.length} error`);
  for (const e of result.errors) console.log(`  [${e.code}] ${e.path || "(spec)"}\n    ${e.message}\n    -> ${e.hint}`);
}
process.exit(result.ok ? 0 : 1);
