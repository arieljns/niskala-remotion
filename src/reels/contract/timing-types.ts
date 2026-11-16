/**
 * Timing sidecar (<id>.timing.json): which voice-over file each scene uses, the
 * cue times inside it, and when each word of a phrase is spoken. Written by
 * `reel:cues` from the recorded voice-over and confirmed by a human, never typed
 * by a model. The kit reads it; the spec stays copy-only. No imports, so both
 * the browser side and the node checks can load it.
 */
export const SCENE_IDS = [
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s7b",
  "s8a",
  "s8b",
  "s8c",
  "s8d",
  "s9",
  "s10",
] as const;
export type TimedSceneId = (typeof SCENE_IDS)[number];

export type SceneVo = {
  file: string;
  /** Length of the file in seconds; the real length is measured at render time. */
  expectedSeconds: number;
  /** Seconds from the start of the file, in increasing order. */
  cues: number[];
};

export type ReelTiming = {
  version: 1;
  /** "legacy-reel01" = hand-measured for the first reel; "cues" = produced by reel:cues and confirmed. */
  source: "legacy-reel01" | "cues";
  /** Folder under public/ that holds the scene files. */
  voDir: string;
  scenes: Record<TimedSceneId, SceneVo>;
  /** Word start times (seconds from the start of the scene file), keyed by phrase path, e.g. "hook.question" or "phone.reveal.1". */
  words: Record<string, number[]>;
  /** source "cues" only: sha256 of the out/<id>/cues.json this was built from, and the human who listened and confirmed. */
  cuesHash?: string;
  confirmedBy?: string;
  confirmedAt?: string;
};

/** How many cues each scene's voice-over has (the kit places things on them). A preset fact, not a choice. */
export const SCENE_CUE_COUNT: Record<TimedSceneId, number> = {
  s1: 3,
  s2: 1,
  s3: 2,
  s4: 2,
  s5: 2,
  s6: 2,
  s7: 2,
  s7b: 2,
  s8a: 3,
  s8b: 2,
  s8c: 2,
  s8d: 2,
  s9: 3,
  s10: 3,
};

/**
 * What is spoken in each scene file, in order. A path starting with "~" is spoken but has no word times
 * (a punch word, an answer); the others are the phrases in `words`. Used to place words on the recording.
 */
export const SCENE_SPEECH: Record<TimedSceneId, string[]> = {
  s1: ["~hook.stop", "hook.question", "hook.hook"],
  s2: ["numpang.line"],
  s3: ["reasons.promo.question", "~reasons.promo.answer"],
  s4: ["reasons.biaya.label", "~reasons.biaya.punch", "reasons.biaya.tail"],
  s5: ["~reasons.omzet.label", "~reasons.omzet.squash", "reasons.omzet.tail"],
  s6: ["blackBeat.phrase"],
  s7: ["solution.first", "solution.second"],
  s7b: ["phone.bridge.0", "phone.bridge.1"],
  s8a: ["phone.reveal.0", "phone.reveal.1", "phone.reveal.2"],
  s8b: ["phone.tap.0", "phone.tap.1"],
  s8c: ["phone.syarat.0", "phone.syarat.1"],
  s8d: ["phone.checkout.0", "phone.checkout.1"],
  s9: ["phone.resolusi.0", "phone.resolusi.1", "phone.resolusi.2"],
  s10: ["cta.phrases.0", "cta.phrases.1", "cta.phrases.2", "cta.phrases.3", "cta.phrases.4"],
};

/** The phrases with word times in a scene, in the order they are spoken. */
export const scenePhrases = (scene: TimedSceneId): string[] =>
  SCENE_SPEECH[scene].filter((path) => !path.startsWith("~"));
