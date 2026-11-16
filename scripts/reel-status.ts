/**
 * npm run reel:status -- <id> [--json]
 *
 * Shows where a reel is in the pipeline and what blocks the next step. State is
 * derived from evidence on disk, never from a stored flag.
 */
import { CONTRACT_VERSION } from "../src/reels/contract/spec.schema.ts";
import { logState, reelContext } from "./lib/pipeline.ts";

const id = process.argv[2];
if (!id || !/^[a-z0-9-]+$/.test(id)) {
  console.error("Pakai: npm run reel:status -- <id> [--json]");
  process.exit(1);
}
const { gates, state } = logState(reelContext(id), CONTRACT_VERSION);
if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ id, state, gates }, null, 2));
} else {
  console.log(`${id}: ${state}`);
  for (const gate of gates) console.log(`  ${gate.ok ? "ok  " : "BELUM"} ${gate.state.padEnd(15)} ${gate.note}`);
  const next = gates.find((gate) => !gate.ok);
  if (next) console.log(`\nBerikutnya: ${next.state}. ${next.note}`);
}
