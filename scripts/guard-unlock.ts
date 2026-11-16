/**
 * npm run guard:unlock
 * Only a human, in their own terminal: type your name and UNLOCK. Restores the write bit and removes
 * .infra-lock. Lock again with npm run guard:lock when the infrastructure work is done.
 */
import { rmSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { isLocked, LOCK_PATH, setReadOnly } from "./lib/guard.ts";

if (!process.stdin.isTTY) {
  console.error("guard:unlock harus dijalankan manusia di terminalnya sendiri (stdin bukan terminal).");
  process.exit(1);
}
if (!isLocked()) {
  console.log("Sudah tidak terkunci.");
  process.exit(0);
}
const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = (await rl.question("Ketik nama kamu lalu UNLOCK: ")).trim();
rl.close();
if (!/^(.*\S)\s+UNLOCK$/.test(answer)) {
  console.error('Format salah. Contoh: "Ariel UNLOCK".');
  process.exit(1);
}
const count = setReadOnly(false);
rmSync(LOCK_PATH, { force: true });
console.log(`Terbuka: ${count} berkas/folder bisa ditulis lagi. Jangan lupa npm run guard:lock setelah selesai.`);
