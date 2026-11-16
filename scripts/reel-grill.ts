/**
 * npm run reel:grill -- <id>
 *
 * Starts a reel: creates data/reels/<date>-<id>/ with a draft brief.md (the
 * template in docs/templates/brief.md) and meta.json, through the same
 * `new-reel` the gate already uses. Then the grill-reel interview fills the
 * brief, and the creator plus an LLM approve it with `npm run approve-brief`.
 * The agent never sets grill status itself.
 */
import { execFileSync } from "node:child_process";
import { CONTRACT_VERSION } from "../src/reels/contract/spec.schema.ts";
import { logState, reelContext } from "./lib/pipeline.ts";

const id = process.argv[2];
if (!id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
  console.error("Pakai: npm run reel:grill -- <id>   (huruf kecil, angka, tanda minus)");
  process.exit(1);
}
process.stdout.write(
  execFileSync("node", ["--no-warnings=ExperimentalWarning", `${import.meta.dirname}/new-reel.ts`, id], {
    encoding: "utf8",
  }),
);
logState(reelContext(id), CONTRACT_VERSION);
console.log("\nLangkah berikutnya:");
console.log(
  "  1. Jalankan wawancara grill-reel (skill grill-reel). Isi juga bagian 5a: angka yang boleh muncul di layar.",
);
console.log(
  "  2. Pembuat mengetik nama + APPROVE, LLM memberi skor + APPROVE, lalu: npm run approve-brief -- <folder>",
);
console.log(`  3. Cek posisi kapan saja: npm run reel:status -- ${id}`);
