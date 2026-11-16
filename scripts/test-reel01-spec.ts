/**
 * npm run test:reel01-spec
 *
 * Proves the golden spec (src/reels/specs/_golden/reel01.ts) says exactly what Reel01
 * says: every phrase, turned back into markup, must appear as a literal in the
 * ORIGINAL scene source at commit a97b8b4 (before the copy moved into the spec).
 * The original code is the reference, not the spec.
 */
import { execFileSync } from "node:child_process";
import { REPO_ROOT } from "./lib/brief.ts";
import { phraseToMarkup, ReelSpec, type Phrase } from "../src/reels/contract/spec.schema.ts";
import { spec } from "../src/reels/specs/_golden/reel01.ts";

const parsed = ReelSpec.safeParse(spec);
if (!parsed.success) {
  console.error("Spec Reel01 tidak lolos kontrak:", JSON.stringify(parsed.error.issues, null, 2));
  process.exit(1);
}

/** The original code, before the copy moved into the spec. Pinned so the reference cannot drift. */
const ORIGINAL_COMMIT = "a97b8b4";
const source = ["copy.ts", "S1Hook.tsx", "Reasons.tsx", "Solution.tsx"]
  .map((file) =>
    execFileSync("git", ["show", `${ORIGINAL_COMMIT}:src/reels/reel01/${file}`], { cwd: REPO_ROOT, encoding: "utf8" }),
  )
  .join("\n");

const phrases: [string, Phrase][] = [
  ["hook.question", spec.hook.question],
  ["hook.hook", spec.hook.hook],
  ["numpang.line", spec.numpang.line],
  ["promo.question", spec.reasons.promo.question],
  ["promo.answer", spec.reasons.promo.answer],
  ["biaya.label", spec.reasons.biaya.label],
  ["biaya.tail", spec.reasons.biaya.tail],
  ["omzet.label", spec.reasons.omzet.label],
  ["omzet.tail", spec.reasons.omzet.tail],
  ["blackBeat", spec.blackBeat.phrase],
  ["solution.first", spec.solution.first],
  ["solution.second", spec.solution.second],
  ...(["bridge", "reveal", "tap", "syarat", "checkout", "resolusi"] as const).flatMap((k) =>
    (spec.phone[k] as readonly Phrase[]).map((p, i): [string, Phrase] => [`phone.${k}[${i}]`, p]),
  ),
  ...spec.cta.phrases.map((p, i): [string, Phrase] => [`cta[${i}]`, p]),
];

let failed = 0;
for (const [name, phrase] of phrases) {
  const literal = JSON.stringify(phraseToMarkup(phrase));
  const found = source.includes(literal) || source.includes(literal.slice(1, -1));
  // `lines: [...]` in the source has spaces after commas; compare with the same spacing.
  const spaced =
    "[" +
    phraseToMarkup(phrase)
      .map((l) => JSON.stringify(l))
      .join(", ") +
    "]";
  if (!found && !source.includes(spaced)) {
    failed++;
    console.error(`BEDA  ${name}: ${spaced}`);
  }
}

const literals = [
  `"${spec.hook.stop}"`,
  `"${spec.reasons.biaya.punch}"`,
  `${JSON.stringify(spec.reasons.omzet.squash).replace(",", ", ")}`,
];
for (const literal of literals) {
  if (!source.includes(literal)) {
    failed++;
    console.error(`BEDA  literal ${literal}`);
  }
}

console.log(
  failed === 0 ? `OK: ${phrases.length} frasa + 3 kata punch sama persis dengan kode Reel01.` : `${failed} beda.`,
);
process.exit(failed === 0 ? 0 : 1);
