import { phraseToMarkup, type Phrase, type ReelSpec } from "../contract/spec.schema";
import type { ReelTiming } from "../contract/timing-types";

/**
 * On-screen copy comes from the spec (src/reels/specs/<id>.ts, golden ones in specs/_golden/) and is turned into
 * the tone markup the layout reads. WHEN each word appears comes from the timing sidecar
 * (<id>.timing.json): `times` are each word's start in seconds from the start of its scene's VO file.
 * One time per word, so a phrase with a different word count than its timing fails loudly.
 */

type Timed = { lines: readonly string[]; at: readonly number[] };

const wordTimes = (timing: ReelTiming, path: string): readonly number[] => {
  const times = timing.words[path];
  if (times === undefined) {
    throw new Error(`Timing sidecar has no word times for "${path}"`);
  }
  return times;
};

const timed = (timing: ReelTiming, path: string, phrases: readonly Phrase[]): Timed[] =>
  phrases.map((phrase, index) => ({ lines: phraseToMarkup(phrase), at: wordTimes(timing, `${path}.${index}`) }));

export type Reel01Copy = ReturnType<typeof buildCopy>;

/** Spec + timing -> everything the Reel01 scenes show as text, and when each word is spoken. */
export function buildCopy(spec: ReelSpec, timing: ReelTiming) {
  const markup = phraseToMarkup;
  const times = (path: string) => wordTimes(timing, path);
  const { phone } = spec;
  return {
    hook: {
      stop: spec.hook.stop,
      question: markup(spec.hook.question),
      hook: markup(spec.hook.hook),
      times: { question: times("hook.question"), hook: times("hook.hook") },
    },
    numpang: { lines: markup(spec.numpang.line), at: times("numpang.line") },
    promo: {
      question: markup(spec.reasons.promo.question),
      answer: markup(spec.reasons.promo.answer),
      times: { question: times("reasons.promo.question") },
    },
    biaya: {
      label: markup(spec.reasons.biaya.label),
      punch: spec.reasons.biaya.punch,
      tail: markup(spec.reasons.biaya.tail),
      times: { label: times("reasons.biaya.label"), tail: times("reasons.biaya.tail") },
    },
    omzet: {
      label: markup(spec.reasons.omzet.label),
      squash: spec.reasons.omzet.squash,
      tail: markup(spec.reasons.omzet.tail),
      times: { tail: times("reasons.omzet.tail") },
    },
    blackBeats: { s6: [{ lines: markup(spec.blackBeat.phrase), at: times("blackBeat.phrase") }] },
    solution: {
      first: markup(spec.solution.first),
      second: markup(spec.solution.second),
      times: { first: times("solution.first"), second: times("solution.second") },
    },
    lines: {
      s7b: timed(timing, "phone.bridge", phone.bridge),
      s8a: timed(timing, "phone.reveal", phone.reveal),
      s8b: timed(timing, "phone.tap", phone.tap),
      s8c: timed(timing, "phone.syarat", phone.syarat),
      s8d: timed(timing, "phone.checkout", phone.checkout),
      s9: timed(timing, "phone.resolusi", phone.resolusi),
      s10: timed(timing, "cta.phrases", spec.cta.phrases),
    },
  };
}
