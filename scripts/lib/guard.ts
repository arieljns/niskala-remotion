/**
 * Local guards (no CI, no push). Two layers, both driven by config/protected-paths.json:
 *  1. guard:lock makes the protected files read-only on disk, so ANY agent (Claude, Gemini, GPT)
 *     fails when it writes them. The same user could chmod them back; that takes a deliberate act.
 *  2. A Claude Code PreToolUse hook (scripts/guard-hook.ts) refuses edits and commands that touch
 *     them, and the commands that only a human may run.
 * Honest limit: this stops accidents and honest agents, not a determined one with a shell.
 * Locked state = the file .infra-lock exists (written by guard:lock, removed by guard:unlock).
 */
import { createHash } from "node:crypto";
import { chmodSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { REPO_ROOT } from "./brief.ts";

type Rule = { pattern: string; why: string };
export type GuardConfig = {
  protect: string[];
  except: string[];
  alwaysForbiddenWrites: string[];
  forbiddenCommands: Rule[];
  forbiddenWhenLocked: Rule[];
};

export const CONFIG_PATH = `${REPO_ROOT}/config/protected-paths.json`;
export const LOCK_PATH = `${REPO_ROOT}/.infra-lock`;
export const loadGuardConfig = (): GuardConfig => JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as GuardConfig;
export const isLocked = (root = REPO_ROOT) => existsSync(`${root}/.infra-lock`);

const longest = (list: string[], rel: string) =>
  list.filter((p) => rel === p || rel === p.replace(/\/$/, "") || rel.startsWith(p)).reduce((n, p) => Math.max(n, p.length), 0);

/** `rel` is a repo-relative path with forward slashes. */
export function isProtected(rel: string, config = loadGuardConfig()): boolean {
  const p = longest(config.protect, rel);
  return p > 0 && p >= longest(config.except, rel);
}

export const toRel = (path: string, root = REPO_ROOT) => relative(root, resolve(root, path)).split("\\").join("/");

export type ToolCall = { tool_name?: string; tool_input?: Record<string, unknown> };

const MUTATING =
  /(^|[\s;&|(])(rm|mv|cp|chmod|chown|tee|truncate|ln|install|dd|touch|mkdir|rsync)\s|\bsed\s+-[a-z]*i|\bperl\s+-[a-z]*i|>>?\s*\S|\bpython3?\b|\bnode\s+(-e|--eval|-p)\b|\bpatch\b|\bgit\s+(apply|mv|rm)\b/;

/** Returns why the call must be refused, or null. `locked` is injectable for tests. */
export function evaluateToolCall(
  call: ToolCall,
  options: { locked?: boolean; root?: string; config?: GuardConfig } = {},
): string | null {
  const root = options.root ?? REPO_ROOT;
  const config = options.config ?? loadGuardConfig();
  const locked = options.locked ?? isLocked(root);
  const tool = call.tool_name ?? "";
  const input = call.tool_input ?? {};

  if (["Write", "Edit", "MultiEdit", "NotebookEdit"].includes(tool)) {
    const target = String(input.file_path ?? input.notebook_path ?? "");
    if (!target) return null;
    const rel = toRel(target, root);
    const name = rel.split("/").pop() ?? "";
    if (config.alwaysForbiddenWrites.includes(name))
      return `${rel}: berkas ini hanya boleh ditulis skrip resmi oleh manusia (approval/kunci).`;
    if (locked && isProtected(rel, config))
      return `${rel} terlindung (config/protected-paths.json) dan repo sedang terkunci. Minta pemilik menjalankan npm run guard:unlock jika ini memang pekerjaan infrastruktur.`;
    return null;
  }

  if (tool === "Bash") {
    const command = String(input.command ?? "");
    for (const rule of config.forbiddenCommands)
      if (new RegExp(rule.pattern).test(command)) return `Perintah ditolak: ${rule.why}`;
    // `2>&1` and `2>/dev/null` are not writes to a file.
    const mutates = MUTATING.test(command.replace(/\d*>&\d+|\d*>\s*\/dev\/null/g, " "));
    for (const name of config.alwaysForbiddenWrites)
      if (mutates && command.includes(name)) return `Perintah ditolak: tidak boleh mengubah ${name}.`;
    if (locked) {
      for (const rule of config.forbiddenWhenLocked)
        if (new RegExp(rule.pattern).test(command)) return `Perintah ditolak saat repo terkunci: ${rule.why}`;
      if (mutates) {
        const tokens = command.split(/[\s"'`;&|()<>=]+/).filter(Boolean);
        const hit = tokens.find((t) => {
          const rel = toRel(t.startsWith(root) ? t : t.replace(/^\.\//, ""), root);
          return !rel.startsWith("..") && isProtected(rel, config);
        });
        if (hit) return `Perintah mengubah ${hit}, yang terlindung dan sedang terkunci (npm run guard:unlock oleh pemilik).`;
      }
    }
  }
  return null;
}

/** Every protected file and directory that exists (specs/_golden is protected even though specs/ is not). */
export function protectedEntries(root = REPO_ROOT, config = loadGuardConfig()): { path: string; dir: boolean }[] {
  const out: { path: string; dir: boolean }[] = [];
  const visit = (abs: string) => {
    const rel = toRel(abs, root);
    if (rel.includes("node_modules") || rel.startsWith(".git/") || rel === ".git") return;
    const dir = statSync(abs).isDirectory();
    if (isProtected(rel, config)) out.push({ path: abs, dir });
    if (dir) for (const name of readdirSync(abs)) visit(join(abs, name));
  };
  for (const prefix of config.protect) {
    const abs = join(root, prefix);
    if (existsSync(abs)) visit(abs);
  }
  // A prefix may be visited twice (nested entries in `protect`); keep one of each.
  return [...new Map(out.map((e) => [e.path, e])).values()];
}

/** Removes (lock) or restores (unlock) the write bit on every protected entry. */
export function setReadOnly(readOnly: boolean, root = REPO_ROOT, config = loadGuardConfig()): number {
  const entries = protectedEntries(root, config);
  for (const { path } of entries) {
    const mode = statSync(path).mode & 0o7777;
    chmodSync(path, readOnly ? mode & ~0o222 : mode | 0o200);
  }
  return entries.length;
}

/** sha256 of every protected file, keyed by repo-relative path. Stored at lock time so guard:audit can see later changes. */
export function protectedHashes(root = REPO_ROOT): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { path, dir } of protectedEntries(root)) {
    if (!dir) out[toRel(path, root)] = createHash("sha256").update(readFileSync(path)).digest("hex");
  }
  return out;
}
