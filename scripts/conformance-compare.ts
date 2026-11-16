/**
 * npm run conformance:compare
 * One table across every scored model in out/conformance/.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { REPO_ROOT } from "./lib/brief.ts";
import type { Result } from "./conformance-score.ts";

const root = `${REPO_ROOT}/out/conformance`;
const results = existsSync(root)
  ? readdirSync(root)
      .filter((name) => existsSync(`${root}/${name}/result.json`))
      .map((name) => JSON.parse(readFileSync(`${root}/${name}/result.json`, "utf8")) as Result)
  : [];
if (!results.length) {
  console.log("Belum ada hasil. Jalankan conformance:init, beri tugas ke model, lalu conformance:score.");
  process.exit(0);
}
const pad = (s: string | number, n: number) => String(s).padEnd(n);
console.log(`${pad("model", 26)}${pad("hasil", 7)}${pad("percobaan", 11)}${pad("hijau di", 10)}${pad("diubah", 9)}galat pertama`);
for (const r of results)
  console.log(
    `${pad(r.label, 26)}${pad(r.verdict, 7)}${pad(r.attempts, 11)}${pad(r.attemptsToGreen ?? "-", 10)}${pad(r.copy.changed === null ? "-" : `${r.copy.changed}/${r.copy.slots}`, 9)}${r.firstAttemptCodes.join(",") || "-"}`,
  );
