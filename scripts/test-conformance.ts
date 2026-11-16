/**
 * npm run test:conformance
 * Tests the conformance harness itself with four stand-in "models" whose outcome we know in advance:
 * a good rewrite, a bad one (emoji and an invented number), the template handed back unchanged, and a good
 * rewrite that also touches a protected file. If the harness gets any of these wrong, its scores mean nothing.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { REPO_ROOT } from "./lib/brief.ts";
import type { Result } from "./conformance-score.ts";

let failed = 0;
const check = (cond: boolean, name: string, detail = "") => {
  if (!cond) failed++;
  console.log(`${cond ? "ok  " : "GAGAL"} ${name}${cond ? "" : `  ${detail}`}`);
};
const run = (script: string, args: string[]) => {
  const r = spawnSync("node", ["--no-warnings=ExperimentalWarning", `${REPO_ROOT}/scripts/${script}`, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    input: "",
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
};
const ws = (label: string) => `${REPO_ROOT}/out/conformance/${label}`;
const labels = ["selftest-good", "selftest-bad", "selftest-template", "selftest-lane"];
const result = (label: string) => JSON.parse(readFileSync(`${ws(label)}/result.json`, "utf8")) as Result;

/**
 * A genuine rewrite of every phrase with the same word counts: swap a and e inside each segment. The hook line is
 * left alone because Reel01's hook is already as wide as the limit allows (859 of 860 px), so any change there
 * trips FIT_LINE_OVERFLOW; that is a finding about the limit, not about the harness.
 */
const rewrite = (source: string) =>
  source
    .replace('"2027."', '"ini."') // the template's "2027" is a number the fixture brief does not allow
    .split("\n")
    .map((line) =>
      line.includes("Jangan biarin")
        ? line
        : line.replace(
            /\b(quiet|strong|accent|plain)\("([^"]*)"\)/g,
            (_, tone: string, text: string) => `${tone}("${text.replace(/[ae]/g, (c) => (c === "a" ? "e" : "a"))}")`,
          ),
    )
    .join("\n");
const STRAY = `${REPO_ROOT}/docs/zz-conformance-stray.md`;

const cleanup = () => {
  for (const label of labels) rmSync(ws(label), { recursive: true, force: true });
  rmSync(STRAY, { force: true });
};
cleanup();
try {
  for (const label of labels) check(run("conformance-init.ts", [label]).status === 0, `init ${label}`);
  check(run("conformance-init.ts", ["selftest-good"]).status === 1, "init tidak menimpa workspace yang sudah ada");

  // good: a real rewrite, in its lane
  const template = readFileSync(`${ws("selftest-good")}/template.ts`, "utf8");
  writeFileSync(`${ws("selftest-good")}/spec.ts`, rewrite(template));
  check(run("conformance-check.ts", ["selftest-good"]).status === 0, "model baik: conformance:check LOLOS");
  const good = run("conformance-score.ts", ["selftest-good"]);
  check(good.status === 0 && result("selftest-good").verdict === "PASS", "model baik: PASS", good.out.slice(0, 300));
  check(result("selftest-good").copy.rewrote, "model baik: dihitung sudah menulis ulang copy");
  check(existsSync(`${ws("selftest-good")}/contact.png`), "model baik: contact sheet dibuat untuk dinilai manusia");

  // bad: emoji + an invented number, never fixes it
  const badSource = readFileSync(`${ws("selftest-bad")}/template.ts`, "utf8").replace(
    'quiet("Kamu jualan")',
    'quiet("Kamu jualan 🔥 50%")',
  );
  writeFileSync(`${ws("selftest-bad")}/spec.ts`, badSource);
  const badCheck = run("conformance-check.ts", ["selftest-bad"]);
  check(badCheck.status === 1 && /CHAR_FORBIDDEN/.test(badCheck.out), "model buruk: ditolak dengan CHAR_FORBIDDEN");
  run("conformance-score.ts", ["selftest-bad"]);
  const bad = result("selftest-bad");
  check(bad.verdict === "FAIL" && bad.firstAttemptCodes.includes("CHAR_FORBIDDEN"), "model buruk: FAIL, galat pertama tercatat");

  // template returned unchanged: not the task (and it even trips the number rule, because of "2027")
  run("conformance-check.ts", ["selftest-template"]);
  run("conformance-score.ts", ["selftest-template"]);
  const same = result("selftest-template");
  check(same.verdict === "FAIL" && !same.copy.rewrote, "template dikembalikan utuh: FAIL");
  check(same.finalCodes.includes("NUMBER_NOT_IN_BRIEF"), "template utuh memicu NUMBER_NOT_IN_BRIEF (jebakan angka 2027 di brief uji)");

  // lane: a good spec, but the model also edits a protected file (docs) and never ran the check after
  writeFileSync(`${ws("selftest-lane")}/spec.ts`, rewrite(readFileSync(`${ws("selftest-lane")}/template.ts`, "utf8")));
  run("conformance-check.ts", ["selftest-lane"]);
  writeFileSync(STRAY, "diubah model\n");
  const laneRun = run("conformance-score.ts", ["selftest-lane"]);
  const lane = result("selftest-lane");
  check(laneRun.status === 1 && lane.verdict === "LANE" && lane.lane.protectedAdded.includes("docs/zz-conformance-stray.md"), "model keluar jalur: LANE walau spec lolos", laneRun.out.slice(0, 300));
  rmSync(STRAY, { force: true });

  // the attempt limit
  const spec = `${ws("selftest-bad")}/attempts.jsonl`;
  writeFileSync(spec, Array.from({ length: 8 }, (_, i) => JSON.stringify({ n: i + 1, ok: false, codes: [], specHash: "x", at: "" })).join("\n") + "\n");
  check(run("conformance-check.ts", ["selftest-bad"]).status === 1, "setelah 8 percobaan, pemeriksaan ditolak");
  check(/selftest-good/.test(run("conformance-compare.ts", []).out), "compare menampilkan hasil per model");
} finally {
  cleanup();
}

console.log(failed === 0 ? "\nSemua tes konformansi lolos." : `\n${failed} GAGAL`);
process.exit(failed === 0 ? 0 : 1);
