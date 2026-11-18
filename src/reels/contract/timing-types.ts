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
  /** Which preset's scenes this sidecar holds. Absent = "reel01-pov-v1" (Reel01 and every sidecar written before presets). */
  preset?: PresetId;
  /** "legacy-reel01" = hand-measured for the first reel; "cues" = produced by reel:cues and confirmed. */
  source: "legacy-reel01" | "cues";
  /** Folder under public/ that holds the scene files. */
  voDir: string;
  /** Only the scenes of the preset: all 14 for "reel01-pov-v1", a subset for "reel01-flow-v1". */
  scenes: Partial<Record<TimedSceneId, SceneVo>>;
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
export const scenePhrases = (scene: TimedSceneId, preset: PresetId = POV_PRESET): string[] =>
  sceneSpeech(preset, scene).filter((path) => !path.startsWith("~"));

/**
 * PRESETS. Reel01's flow (14 scenes) is "reel01-pov-v1". "reel01-flow-v1" is a SUBSET of it in the same
 * relative order, with the same design: s1 hook, s2 numpang, s3-s4 reasons (promo, biaya; no omzet),
 * s6 black beat, s10 CTA. No s5, s7, s7b, s8a-d, s9. Scene ids keep their Reel01 names so the kit
 * (S1Hook, Numpang, Reasons, BlackBeat, Cta) is shared and nothing about Reel01 changes.
 */
export const POV_PRESET = "reel01-pov-v1" as const;
export const FLOW_PRESET = "reel01-flow-v1" as const;
export const PRESET_IDS = [POV_PRESET, FLOW_PRESET] as const;
export type PresetId = (typeof PRESET_IDS)[number];

/** The scenes of a preset, in the order they play. */
export const FLOW_SCENE_IDS = ["s1", "s2", "s3", "s4", "s6", "s10"] as const satisfies readonly TimedSceneId[];

/**
 * Flow: s6 is three phrases (a long de-escalation split up), one cue each. s10 is three phrases, one cue each:
 * cue 0 the opening line on Night, cue 1 the hard cut to Mist with the follow card, cue 2 the URL bar (Cta.tsx).
 */
const FLOW_CUE_COUNT: Partial<Record<TimedSceneId, number>> = {
  s1: 3,
  s2: 1,
  s3: 2,
  s4: 2,
  s6: 3,
  s10: 3,
};

const FLOW_SPEECH: Partial<Record<TimedSceneId, string[]>> = {
  s1: ["~hook.stop", "hook.question", "hook.hook"],
  s2: ["numpang.line"],
  s3: ["reasons.promo.question", "~reasons.promo.answer"],
  s4: ["reasons.biaya.label", "~reasons.biaya.punch", "reasons.biaya.tail"],
  s6: ["blackBeat.phrases.0", "blackBeat.phrases.1", "blackBeat.phrases.2"],
  s10: ["cta.phrases.0", "cta.phrases.1", "cta.phrases.2"],
};

export const presetScenes = (preset: PresetId): readonly TimedSceneId[] =>
  preset === FLOW_PRESET ? FLOW_SCENE_IDS : SCENE_IDS;

export const sceneCueCount = (preset: PresetId, scene: TimedSceneId): number =>
  (preset === FLOW_PRESET ? FLOW_CUE_COUNT[scene] : SCENE_CUE_COUNT[scene]) ?? 0;

export const sceneSpeech = (preset: PresetId, scene: TimedSceneId): string[] =>
  (preset === FLOW_PRESET ? FLOW_SPEECH[scene] : SCENE_SPEECH[scene]) ?? [];

/** The preset a timing sidecar is for. Sidecars from before presets have no field and are Reel01's. */
export const timingPreset = (timing: { preset?: PresetId }): PresetId => timing.preset ?? POV_PRESET;

/** The preset of a spec that has not been validated yet (scripts hold it as `unknown`). Anything but the flow preset is Reel01's. */
export const presetOfSpec = (spec: unknown): PresetId =>
  (spec as { preset?: unknown } | null)?.preset === FLOW_PRESET ? FLOW_PRESET : POV_PRESET;

/** Remotion composition that renders a preset. Reel01 stays "Reel01". */
export const compositionIdFor = (preset: PresetId): "Reel01" | "ReelFlow" =>
  preset === FLOW_PRESET ? "ReelFlow" : "Reel01";
