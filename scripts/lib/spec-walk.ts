/** Lists every phrase slot and every string in a reel01-pov-v1 spec, with its path, so checks can point at the exact spot. */
import type { Phrase, ReelSpec } from "../../src/reels/contract/spec.schema.ts";

export function phraseSlots(spec: ReelSpec): [string, Phrase][] {
  return [
    ["hook.question", spec.hook.question],
    ["hook.hook", spec.hook.hook],
    ["numpang.line", spec.numpang.line],
    ["reasons.promo.question", spec.reasons.promo.question],
    ["reasons.promo.answer", spec.reasons.promo.answer],
    ["reasons.biaya.label", spec.reasons.biaya.label],
    ["reasons.biaya.tail", spec.reasons.biaya.tail],
    ["reasons.omzet.label", spec.reasons.omzet.label],
    ["reasons.omzet.tail", spec.reasons.omzet.tail],
    ["blackBeat.phrase", spec.blackBeat.phrase],
    ["solution.first", spec.solution.first],
    ["solution.second", spec.solution.second],
    ...(["bridge", "reveal", "tap", "syarat", "checkout", "resolusi"] as const).flatMap((key) =>
      (spec.phone[key] as readonly Phrase[]).map((phrase, index): [string, Phrase] => [
        `phone.${key}.${index}`,
        phrase,
      ]),
    ),
    ...spec.cta.phrases.map((phrase, index): [string, Phrase] => [`cta.phrases.${index}`, phrase]),
  ];
}

export type SpecString = { path: string; text: string };

/** Every string the spec carries that can reach the screen or a filename: segment text, punch and squash words, the id. */
export function specStrings(spec: ReelSpec): SpecString[] {
  const strings: SpecString[] = [{ path: "id", text: spec.id }];
  for (const [path, phrase] of phraseSlots(spec)) {
    phrase.forEach((line, lineIndex) =>
      line.forEach((segment, segmentIndex) =>
        strings.push({ path: `${path}.${lineIndex}.${segmentIndex}.text`, text: segment.text }),
      ),
    );
  }
  strings.push({ path: "hook.stop", text: spec.hook.stop });
  strings.push({ path: "reasons.biaya.punch", text: spec.reasons.biaya.punch });
  spec.reasons.omzet.squash.forEach((word, index) =>
    strings.push({ path: `reasons.omzet.squash.${index}`, text: word }),
  );
  return strings;
}

/** A phrase as plain running text (segments joined the way the renderer joins them), for phrase-level checks. */
export function phrasePlainText(phrase: Phrase): string {
  return phrase
    .map((line) =>
      line
        .map((segment, index) => (index === 0 || /^[.,?!:;%)]/.test(segment.text) ? segment.text : ` ${segment.text}`))
        .join(""),
    )
    .join(" ");
}

/** The text spoken for a path: a phrase slot, or one of the single words (hook.stop, biaya.punch, omzet.squash). */
export function speechText(spec: ReelSpec, path: string): string {
  const plain = path.replace(/^~/, "");
  if (plain === "hook.stop") return spec.hook.stop;
  if (plain === "reasons.biaya.punch") return spec.reasons.biaya.punch;
  if (plain === "reasons.omzet.squash") return spec.reasons.omzet.squash.join("");
  const slot = phraseSlots(spec).find(([slotPath]) => slotPath === plain);
  if (!slot) throw new Error(`No spoken text for "${path}"`);
  return phrasePlainText(slot[1]);
}
