/**
 * npm run guard:lock  /  npm run guard:status
 * Makes everything in config/protected-paths.json read-only and writes .infra-lock. Anyone may lock.
 * Unlocking is guard-unlock.ts, human only.
 */
import { writeFileSync } from "node:fs";
import { isLocked, LOCK_PATH, protectedEntries, protectedHashes, setReadOnly } from "./lib/guard.ts";

if (process.argv[2] === "--status") {
  console.log(isLocked() ? `Terkunci (${protectedEntries().length} berkas/folder terlindung).` : "Tidak terkunci.");
  process.exit(0);
}
const count = setReadOnly(true);
writeFileSync(LOCK_PATH, JSON.stringify({ lockedAt: new Date().toISOString(), entries: count, hashes: protectedHashes() }) + "\n");
console.log(`Terkunci: ${count} berkas/folder dibuat read-only. Buka lagi: npm run guard:unlock (manusia, di terminal).`);
