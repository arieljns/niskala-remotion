/**
 * npm run conformance:check -- <label>
 *
 * What the model runs to iterate. Checks out/conformance/<label>/spec.ts with the real checks (contract, copy
 * lint, fit, motion, duration, word counts) and logs the attempt. Exit 0 = LOLOS, 1 = errors. After
 * 8 attempts it refuses further runs, so a model cannot brute-force its way through.
 */
import { existsSync } from "node:fs";
import { openFitSession } from "./lib/fit-probe.ts";
import { LABEL_RE, MAX_ATTEMPTS, evaluate, logAttempt, readAttempts, workspace } from "./lib/conformance.ts";

const label = process.argv[2];
if (!label || !LABEL_RE.test(label) || !existsSync(`${workspace(label)}/spec.ts`)) {
  console.error("Pakai: npm run conformance:check -- <label>   (jalankan conformance:init dulu)");
  process.exit(1);
}
if (readAttempts(label).length >= MAX_ATTEMPTS) {
  console.error(`Batas ${MAX_ATTEMPTS} percobaan sudah habis. Berhenti dan laporkan apa yang menghalangi.`);
  process.exit(1);
}

const session = await openFitSession();
let evaluation;
try {
  evaluation = await evaluate(label, session);
} finally {
  await session.close();
}
const attempt = logAttempt(label, evaluation);

if (evaluation.ok) {
  console.log(`LOLOS ${label} (percobaan ${attempt.n} dari maksimal ${MAX_ATTEMPTS})`);
} else {
  console.log(`GAGAL ${label}: ${evaluation.errors.length} error (percobaan ${attempt.n} dari maksimal ${MAX_ATTEMPTS})`);
  for (const e of evaluation.errors)
    console.log(`  [${e.code}] ${e.path || "(spec)"}\n    ${e.message}\n    -> ${e.hint}`);
}
process.exit(evaluation.ok ? 0 : 1);
