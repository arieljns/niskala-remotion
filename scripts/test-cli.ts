/**
 * npm run test:cli
 * Runs the real commands the way an agent would, including the ways an agent might try to get around them,
 * and checks they refuse: exit code, the error code in the output, and that no forbidden file appeared.
 * Slow-ish (spawns node); the library-level fixtures are in test:negative.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { REPO_ROOT } from "./lib/brief.ts";

let failed = 0;
const check = (cond: boolean, name: string, detail = "") => {
  if (!cond) failed++;
  console.log(`${cond ? "ok  " : "GAGAL"} ${name}${cond ? "" : `  ${detail}`}`);
};
const run = (script: string, args: string[] = []) => {
  const r = spawnSync("node", ["--no-warnings=ExperimentalWarning", `${REPO_ROOT}/scripts/${script}`, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    input: "", // stdin is a pipe, never a terminal: exactly an agent's situation
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
};

/* --explain covers every code, and an unknown code is refused */
const catalog = JSON.parse(readFileSync(`${REPO_ROOT}/src/reels/contract/errors.json`, "utf8")) as Record<
  string,
  { fix?: string }
>;
const codes = Object.keys(catalog).filter((k) => !k.startsWith("_"));
const unexplained = codes.filter((code) => {
  const r = run("reel-check.ts", ["--explain", code]);
  return r.status !== 0 || !r.out.includes(code) || !catalog[code].fix;
});
check(unexplained.length === 0, `--explain menjelaskan semua ${codes.length} kode`, unexplained.join(","));
check(run("reel-check.ts", ["--explain", "NOPE"]).status === 1, "--explain kode yang tidak ada ditolak");

/* a reel with an emoji, no timing and no brief */
const bad = `${REPO_ROOT}/src/reels/specs/zz-cli-bad.ts`;
const source = readFileSync(`${REPO_ROOT}/src/reels/specs/_golden/reel01.ts`, "utf8")
  .replace("../../contract", "../contract")
  .replace('id: "reel01"', 'id: "zz-cli-bad"')
  .replace('quiet("Kamu jualan")', 'quiet("Kamu jualan 🔥")');
const approvedOf = (id: string) => existsSync(`${REPO_ROOT}/out/${id}/APPROVED`);
try {
  writeFileSync(bad, source);
  const r = run("reel-check.ts", ["zz-cli-bad", "--json"]);
  const found = (JSON.parse(r.out) as { errors: { code: string }[] }).errors.map((e) => e.code);
  check(r.status === 1, "reel:check spec dengan emoji keluar 1", String(r.status));
  for (const code of ["CHAR_FORBIDDEN", "BRIEF_NOT_APPROVED", "TIMING_MISSING"])
    check(found.includes(code), `reel:check melaporkan ${code}`, found.join(","));

  // Every later step refuses while the earlier gates have not passed.
  const render = run("reel-render.ts", ["zz-cli-bad"]);
  check(render.status === 1 && /GATE_NOT_PASSED|APPROVAL_MISSING/.test(render.out), "reel:render ditolak sebelum approval");
  const official = run("render.ts", ["data/reels/tidak-ada"]);
  check(official.status === 1, "npm run render pada folder yang tidak ada ditolak");
  const approve = run("reel-approve.ts", ["zz-cli-bad"]);
  check(approve.status === 1 && /GATE_NOT_PASSED/.test(approve.out), "persetujuan ditolak sebelum gerbang lolos");
  const cues = run("reel-cues.ts", ["zz-cli-bad", "--confirm"]);
  check(cues.status === 1, "konfirmasi cue ditolak tanpa terminal");
  check(!approvedOf("zz-cli-bad"), "tidak ada APPROVED yang muncul untuk reel yang gagal");
} finally {
  rmSync(bad, { force: true });
  rmSync(`${REPO_ROOT}/out/zz-cli-bad`, { recursive: true, force: true });
}

/* a reel that is otherwise fine still cannot be approved or unlocked without a human at a terminal */
const before = approvedOf("demo-variasi");
const approveDemo = run("reel-approve.ts", ["demo-variasi"]);
check(
  approveDemo.status === 1 && approvedOf("demo-variasi") === before,
  "persetujuan tanpa terminal ditolak dan tidak menulis APPROVED",
  approveDemo.out.slice(0, 160),
);
const unlock = run("guard-unlock.ts");
check(unlock.status === 1 && /manusia/.test(unlock.out), "guard:unlock tanpa terminal ditolak");

console.log(failed === 0 ? "\nSemua tes CLI lolos." : `\n${failed} GAGAL`);
process.exit(failed === 0 ? 0 : 1);
