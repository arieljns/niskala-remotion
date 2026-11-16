/**
 * npm run test:guard
 * The guards must refuse what they promise to refuse, and must not get in the way of normal reel work.
 * Runs on a throwaway directory for the read-only layer; never touches the real repo's permissions.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { evaluateToolCall, isProtected, protectedEntries, setReadOnly } from "./lib/guard.ts";

let failed = 0;
const check = (cond: boolean, name: string) => {
  if (!cond) failed++;
  console.log(`${cond ? "ok  " : "GAGAL"} ${name}`);
};
const call = (tool_name: string, tool_input: Record<string, unknown>, locked: boolean) =>
  evaluateToolCall({ tool_name, tool_input }, { locked });

// Which paths count as protected
for (const p of ["src/reels/reel01/Cta.tsx", "src/reels/contract/spec.schema.ts", "src/reels/specs/_golden/reel01.ts", "scripts/lib/pipeline.ts", "docs/WORKFLOW.md", "public/fonts/x.woff2", "AGENTS.md", "package.json"])
  check(isProtected(p), `terlindung: ${p}`);
for (const p of ["src/reels/specs/my-reel.ts", "src/reels/specs/my-reel.timing.json", "src/reels/reel03/Reel03.tsx", "data/reels/x/brief.md", "public/reels/my-reel/vo-raw/s1.wav", "out/my-reel/check.json"])
  check(!isProtected(p), `boleh ditulis: ${p}`);

// Edits
check(call("Write", { file_path: "/x/src/reels/specs/a.ts" }, true) === null, "locked: spec baru boleh ditulis");
check(call("Write", { file_path: join(process.cwd(), "scripts/lib/guard.ts") }, true) !== null, "locked: Write ke scripts ditolak");
check(call("Edit", { file_path: join(process.cwd(), "src/reels/reel01/Cta.tsx") }, true) !== null, "locked: Edit ke kit ditolak");
check(call("Edit", { file_path: join(process.cwd(), "src/reels/reel01/Cta.tsx") }, false) === null, "unlocked: Edit ke kit boleh (kerja infrastruktur)");
check(call("Write", { file_path: join(process.cwd(), "out/a/APPROVED") }, false) !== null, "APPROVED tidak boleh ditulis, terkunci atau tidak");
check(call("Write", { file_path: join(process.cwd(), ".infra-lock") }, false) !== null, ".infra-lock tidak boleh ditulis agent");

// Commands that only a human, or the official pipeline, may run (locked or not)
for (const c of [
  "npm run reel:approve -- my-reel",
  "node scripts/reel-approve.ts my-reel",
  "npm run reel:cues -- my-reel --confirm",
  "npm run guard:unlock",
  "npx remotion render Reel01 out/x.mp4",
  "npx remotion still Reel01 out/x.png",
  "git push origin main",
  "git commit --no-verify -m x",
  "echo '{}' > out/my-reel/APPROVED",
  "rm .infra-lock",
])
  check(call("Bash", { command: c }, false) !== null, `ditolak: ${c}`);

// Normal work is never blocked
for (const c of [
  "npm run reel:check -- my-reel",
  "npm run reel:stills -- my-reel",
  "npm run reel:render -- my-reel",
  "npm run reel:cues -- my-reel",
  "npx remotion ffmpeg -i a.wav b.wav",
  "cat out/my-reel/APPROVED",
  "cat scripts/lib/pipeline.ts 2>&1 | head",
  "grep -n x src/reels/reel01/Cta.tsx",
  "git status",
])
  check(call("Bash", { command: c }, true) === null, `boleh saat terkunci: ${c}`);

// Mutating a protected path from the shell, only while locked
for (const c of ["sed -i 's/a/b/' src/reels/reel01/Cta.tsx", "echo x >> scripts/lib/pipeline.ts", "rm -rf docs", "cp /tmp/x src/theme/fonts.ts", "git checkout -- src/Root.tsx", "git stash"]) {
  check(call("Bash", { command: c }, true) !== null, `terkunci, ditolak: ${c}`);
  if (!c.startsWith("git")) check(call("Bash", { command: c }, false) === null, `tidak terkunci, boleh: ${c}`);
}

// The read-only layer, on a throwaway tree
const root = mkdtempSync(join(tmpdir(), "niskala-guard-"));
try {
  for (const dir of ["scripts", "src/reels/reel01", "src/reels/specs/_golden", "src/reels/reel03", "docs"]) mkdirSync(join(root, dir), { recursive: true });
  const files = ["scripts/a.ts", "src/reels/reel01/k.tsx", "src/reels/specs/_golden/g.ts", "src/reels/specs/mine.ts", "src/reels/reel03/r.tsx", "docs/d.md"];
  for (const f of files) writeFileSync(join(root, f), "x");
  const writable = (f: string) => {
    try {
      writeFileSync(join(root, f), "y");
      return true;
    } catch {
      return false;
    }
  };
  check(protectedEntries(root).length > 0, "entri terlindung ditemukan");
  setReadOnly(true, root);
  check(!writable("scripts/a.ts") && !writable("src/reels/reel01/k.tsx") && !writable("docs/d.md") && !writable("src/reels/specs/_golden/g.ts"), "terkunci: berkas terlindung gagal ditulis oleh proses apa pun");
  check(writable("src/reels/specs/mine.ts") && writable("src/reels/reel03/r.tsx"), "terkunci: spec dan reel lain tetap bisa ditulis");
  const newFile = (f: string) => {
    try {
      writeFileSync(join(root, f), "z");
      return true;
    } catch {
      return false;
    }
  };
  check(!newFile("scripts/new.ts") && newFile("src/reels/specs/new.ts"), "terkunci: tidak bisa membuat berkas baru di folder terlindung, spec baru bisa");
  setReadOnly(false, root);
  check(writable("scripts/a.ts") && writable("docs/d.md"), "dibuka: bisa ditulis lagi");
} finally {
  setReadOnly(false, root);
  rmSync(root, { recursive: true, force: true });
}

console.log(failed === 0 ? "\nSemua tes guard lolos." : `\n${failed} GAGAL`);
process.exit(failed === 0 ? 0 : 1);
