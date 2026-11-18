/**
 * THE SPEC CONTRACT. Single source of truth for what a reel spec may contain.
 *
 * STYLE LOCK: every visual rule (tone, colour, design system, font, UI, assets,
 * cutting, editing) comes from Reel01. The spec holds copy only. It has no
 * numeric fields, no colours, no positions, no easing, no camera, no frame
 * numbers, no asset paths. Those live in the kit, so no model can change them.
 * strictObject rejects every key not listed here.
 *
 * Read-only for agents. Changing this file means bumping CONTRACT_VERSION.
 */
import { z } from "zod";

export const CONTRACT_VERSION = "1.0.0";

/** Limits taken from Reel01, the first and only preset so far. */
export const PRESET_REEL01_POV_V1 = {
  id: "reel01-pov-v1",
  maxLinesPerPhrase: 3,
  maxSegmentsPerLine: 3,
  maxWordsPerPhrase: 8,
  maxAccentPerPhrase: 1,
  punchMaxChars: 12,
  /** Reel01 itself is 61.7 s and exempt; new reels must stay under this (config/brief-gate.json). */
  maxSecondsExclusive: 60,
} as const;

/**
 * Second preset: the same limits and the same design, a different flow (see FLOW_SCENE_IDS in timing-types.ts).
 * Reel01's limits are copied, never loosened.
 */
export const PRESET_REEL01_FLOW_V1 = { ...PRESET_REEL01_POV_V1, id: "reel01-flow-v1" } as const;

/** The message hierarchy of Reel01: accent (the point), strong (what it is about), quiet (connecting words). */
export const TONES = ["plain", "quiet", "strong", "accent"] as const;
export type Tone = (typeof TONES)[number];

const LINE_SEPARATORS = String.fromCharCode(0x2028, 0x2029);
const NO_BREAKS = new RegExp("^[^\\r\\n\\t" + LINE_SEPARATORS + "]+$");

/** Text of one segment. No line breaks: a line is an array entry, never a "\n". */
const SegmentText = z.string().min(1).max(60).regex(NO_BREAKS, "line breaks are not allowed in text");

const Segment = z.strictObject({ text: SegmentText, tone: z.enum(TONES) });
export type Segment = z.infer<typeof Segment>;

const Line = z.array(Segment).min(1).max(PRESET_REEL01_POV_V1.maxSegmentsPerLine);

const wordCount = (lines: readonly (readonly Segment[])[]) =>
  lines.flat().reduce((sum, segment) => sum + segment.text.trim().split(/\s+/).length, 0);

/**
 * A phrase is the text shown together and timed to one cue. At most one accent
 * segment. A segment starting with . , ? ! : ; % ) attaches to the previous one with no space.
 */
export const Phrase = z
  .array(Line)
  .min(1)
  .max(PRESET_REEL01_POV_V1.maxLinesPerPhrase)
  .superRefine((lines, ctx) => {
    const accents = lines.flat().filter((segment) => segment.tone === "accent").length;
    if (accents > PRESET_REEL01_POV_V1.maxAccentPerPhrase) {
      ctx.addIssue({
        code: "custom",
        message: `ACCENT_INVALID: ${accents} accent segments, at most ${PRESET_REEL01_POV_V1.maxAccentPerPhrase}`,
      });
    }
    const words = wordCount(lines);
    if (words > PRESET_REEL01_POV_V1.maxWordsPerPhrase) {
      ctx.addIssue({
        code: "custom",
        message: `PRESET_VIOLATION: ${words} words, at most ${PRESET_REEL01_POV_V1.maxWordsPerPhrase}`,
      });
    }
  });
export type Phrase = z.infer<typeof Phrase>;

/** One big impact word (STOP., NAIK). Letters and . ! ? - only, one word. */
const PunchWord = z
  .string()
  .max(PRESET_REEL01_POV_V1.punchMaxChars)
  .regex(/^[A-Za-z][A-Za-z.!?-]*$/, "one word, letters and . ! ? - only");

/** A squashed two-line word (Segitu- / segitu): exactly two single words. */
const SquashLines = z.tuple([PunchWord, PunchWord]);

const pair = <T extends z.ZodType>(item: T) => z.tuple([item, item]);
const triple = <T extends z.ZodType>(item: T) => z.tuple([item, item, item]);

/**
 * Reel01's scene order is the preset: S1 hook, S2 numpang, S3-S5 reasons, S6 black
 * beat, S7 solution, S7b-S9 phone flow, S10 CTA. The spec only fills the slots.
 * The order of entries inside a tuple is the order they appear on screen.
 */
const SpecId = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{1,40}$/,
    "ID_INVALID: id must be a slug: lowercase letters, digits and hyphens, 2 to 41 characters",
  );

export const ReelSpec = z.strictObject({
  contractVersion: z.literal(CONTRACT_VERSION),
  preset: z.literal(PRESET_REEL01_POV_V1.id),
  id: SpecId,
  hookVariant: z.enum(["stop", "plain"]),
  hook: z.strictObject({
    stop: PunchWord,
    question: Phrase,
    hook: Phrase,
  }),
  numpang: z.strictObject({ line: Phrase }),
  reasons: z.strictObject({
    promo: z.strictObject({ question: Phrase, answer: Phrase }),
    biaya: z.strictObject({ label: Phrase, punch: PunchWord, tail: Phrase }),
    omzet: z.strictObject({ label: Phrase, squash: SquashLines, tail: Phrase }),
  }),
  blackBeat: z.strictObject({ phrase: Phrase }),
  solution: z.strictObject({ first: Phrase, second: Phrase }),
  phone: z.strictObject({
    bridge: pair(Phrase),
    reveal: triple(Phrase),
    tap: pair(Phrase),
    syarat: pair(Phrase),
    checkout: pair(Phrase),
    resolusi: triple(Phrase),
  }),
  cta: z.strictObject({
    phrases: z.tuple([Phrase, Phrase, Phrase, Phrase, Phrase]),
  }),
});
export type ReelSpec = z.infer<typeof ReelSpec>;

/**
 * "reel01-flow-v1": a subset of Reel01's flow in the same relative order, same design.
 * S1 hook, S2 numpang, S3 promo, S4 biaya, S6 black beat (3 phrases), S10 CTA (3 phrases).
 * No omzet (S5), solution (S7) or phone flow (S7b-S9). Everything else matches ReelSpec.
 * contractVersion stays 1.0.0: adding a preset changes nothing for Reel01 or its golden specs.
 */
export const FlowSpec = z.strictObject({
  contractVersion: z.literal(CONTRACT_VERSION),
  preset: z.literal(PRESET_REEL01_FLOW_V1.id),
  id: SpecId,
  hookVariant: z.enum(["stop", "plain"]),
  hook: z.strictObject({
    stop: PunchWord,
    question: Phrase,
    hook: Phrase,
  }),
  numpang: z.strictObject({ line: Phrase }),
  reasons: z.strictObject({
    promo: z.strictObject({ question: Phrase, answer: Phrase }),
    biaya: z.strictObject({ label: Phrase, punch: PunchWord, tail: Phrase }),
  }),
  blackBeat: z.strictObject({ phrases: triple(Phrase) }),
  cta: z.strictObject({ phrases: triple(Phrase) }),
});
export type FlowSpec = z.infer<typeof FlowSpec>;

/** Any spec a reel may have. `preset` decides which shape it must be. */
export const AnySpec = z.discriminatedUnion("preset", [ReelSpec, FlowSpec]);
export type AnySpec = ReelSpec | FlowSpec;

/** Spec -> the ** / __ / ~~ markup that the kit's layoutSentence reads. Used by the renderer and the equivalence test. */
const MARK: Record<Tone, string> = {
  plain: "",
  quiet: "~~",
  strong: "__",
  accent: "**",
};
const GLUE = /^[.,?!:;%)]/;

export function lineToMarkup(line: readonly Segment[]): string {
  return line
    .map((segment, index) => {
      const mark = MARK[segment.tone];
      const text = `${mark}${segment.text}${mark}`;
      return index === 0 || GLUE.test(segment.text) ? text : ` ${text}`;
    })
    .join("");
}

export const phraseToMarkup = (phrase: Phrase): string[] => phrase.map(lineToMarkup);

/** Builders for writing specs: they produce structured segments, never markup strings. */
export const plain = (text: string): Segment => ({ text, tone: "plain" });
export const quiet = (text: string): Segment => ({ text, tone: "quiet" });
export const strong = (text: string): Segment => ({ text, tone: "strong" });
export const accent = (text: string): Segment => ({ text, tone: "accent" });
