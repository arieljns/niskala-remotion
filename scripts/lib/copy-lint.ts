/**
 * Copy lint for every string in a spec (Stage B). Allowlist, not blacklist:
 * anything outside contract/allowed-chars.json is rejected, which also blocks
 * emoji, zero-width characters, homoglyphs and the ** __ ~~ markup characters
 * that the renderer reads as tone markers.
 */
import { readFileSync } from "node:fs";
import { REPO_ROOT } from "./brief.ts";
import { phrasePlainText, phraseSlots, specStrings } from "./spec-walk.ts";
import type { ReelSpec } from "../../src/reels/contract/spec.schema.ts";

export type SpecError = { code: string; path: string; message: string; hint: string };

const CONTRACT_DIR = `${REPO_ROOT}/src/reels/contract`;

type Forbidden = { phrases: { phrase: string; hint: string }[] };
const allowedChars = JSON.parse(readFileSync(`${CONTRACT_DIR}/allowed-chars.json`, "utf8")) as {
  markupChars: string[];
};
const forbidden = JSON.parse(readFileSync(`${CONTRACT_DIR}/forbidden.json`, "utf8")) as Forbidden;

/**
 * Relaxed on purpose (see allowed-chars.json): Latin letters (accents included), digits, all punctuation,
 * math and currency symbols, and the plain space. Everything else breaks the render or cannot be seen in review.
 */
const ALLOWED = /^(?:\p{Script=Latin}|\p{N}|\p{P}|\p{Sm}|\p{Sc}| )$/u;
const isAllowed = (ch: string): boolean => ALLOWED.test(ch) && !allowedChars.markupChars.includes(ch);

const u = (code: number) => `U+${code.toString(16).toUpperCase().padStart(4, "0")}`;

/** Invisible characters worth naming in the message. */
const INVISIBLE: Record<number, string> = {
  0x200b: "zero-width space",
  0x200c: "zero-width non-joiner",
  0x200d: "zero-width joiner",
  0x2060: "word joiner",
  0xfeff: "zero-width no-break space",
  0x00ad: "soft hyphen",
  0xfe0f: "variation selector",
};

function hintFor(ch: string): string {
  if (allowedChars.markupChars.includes(ch))
    return "Hapus. Karakter * _ ~ dibaca renderer sebagai penanda tone; tone diatur lewat field tone, bukan lewat teks.";
  if (/\p{Extended_Pictographic}|\p{So}/u.test(ch)) return "Hapus emoji atau simbol. Gaya Reel01 tidak memakainya.";
  if (/\p{L}/u.test(ch)) return "Pakai huruf Latin. Huruf aksara lain dirender dengan font cadangan dan merusak gaya.";
  return "Hapus. Karakter ini tidak terlihat atau tidak didukung font; tulis ulang dengan huruf, angka, dan tanda baca biasa.";
}

export function lintChars(text: string, path: string): SpecError[] {
  const errors: SpecError[] = [];
  if (text !== text.normalize("NFC")) {
    errors.push({
      code: "CHAR_FORBIDDEN",
      path,
      message: "Teks tidak dalam bentuk Unicode NFC (ada combining mark atau bentuk terurai).",
      hint: "Tulis ulang dengan huruf Latin biasa tanpa tanda diakritik.",
    });
  }
  let index = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (!isAllowed(ch)) {
      const label = INVISIBLE[code] ? ` (${INVISIBLE[code]}, tak terlihat)` : "";
      errors.push({
        code: "CHAR_FORBIDDEN",
        path,
        message: `Karakter ${u(code)}${label} di posisi ${index} tidak diizinkan.`,
        hint: hintFor(ch),
      });
    }
    index++;
  }
  return errors;
}

const normalise = (text: string) =>
  ` ${text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;

export function lintPhrases(spec: ReelSpec): SpecError[] {
  const errors: SpecError[] = [];
  for (const [path, phrase] of phraseSlots(spec)) {
    const text = normalise(phrasePlainText(phrase));
    for (const entry of forbidden.phrases) {
      if (text.includes(normalise(entry.phrase))) {
        errors.push({
          code: "PHRASE_FORBIDDEN",
          path,
          message: `Frasa terlarang "${entry.phrase}".`,
          hint: entry.hint,
        });
      }
    }
  }
  return errors;
}

const NUMBER = /\d+(?:[.,]\d+)*/g;

/** `allowed` = numbers from the approved brief; null = the reel is exempt (Reel01 predates the gate). */
export function lintNumbers(spec: ReelSpec, allowed: ReadonlySet<string> | null): SpecError[] {
  if (allowed === null) return [];
  const errors: SpecError[] = [];
  for (const { path, text } of specStrings(spec)) {
    if (path === "id") continue;
    for (const match of text.matchAll(NUMBER)) {
      if (!allowed.has(match[0])) {
        errors.push({
          code: "NUMBER_NOT_IN_BRIEF",
          path,
          message: `Angka "${match[0]}" tidak ada di bagian "Angka yang boleh muncul di layar" pada brief yang sudah approved.`,
          hint: 'Hapus angkanya, atau tambahkan ke tabel angka di brief lalu approve ulang. Label "Contoh" tidak melegalkan angka yang tidak ada di brief.',
        });
      }
    }
  }
  return errors;
}

/** Numbers listed in a brief's "Angka yang boleh muncul di layar" table (first column). */
export function numbersFromBrief(briefText: string): Set<string> {
  const lines = briefText.split("\n");
  const start = lines.findIndex((line) => /^##\s+.*angka yang boleh muncul di layar/i.test(line));
  const numbers = new Set<string>();
  if (start === -1) return numbers;
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break;
    if (!line.trim().startsWith("|") || /^\|\s*:?-{2,}/.test(line.trim())) continue;
    const firstCell = line.split("|")[1] ?? "";
    for (const match of firstCell.matchAll(NUMBER)) numbers.add(match[0]);
  }
  return numbers;
}

export function lintCopy(spec: ReelSpec, allowedNumbers: ReadonlySet<string> | null): SpecError[] {
  return [
    ...specStrings(spec).flatMap(({ path, text }) => lintChars(text, path)),
    ...lintPhrases(spec),
    ...lintNumbers(spec, allowedNumbers),
  ];
}
