/**
 * Claude Code PreToolUse hook (see .claude/settings.json). Reads the tool call as JSON on stdin and
 * exits 2 with the reason on stderr to refuse it. Other agents are covered by AGENTS.md and the
 * read-only files from guard:lock. Failing open on unreadable input is deliberate: a broken hook must
 * not freeze unrelated work; the OS read-only layer still holds.
 */
import { evaluateToolCall, type ToolCall } from "./lib/guard.ts";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
let call: ToolCall = {};
try {
  call = JSON.parse(raw) as ToolCall;
} catch {
  process.exit(0);
}
const reason = evaluateToolCall(call);
if (reason) {
  console.error(`⛔ guard: ${reason}`);
  process.exit(2);
}
