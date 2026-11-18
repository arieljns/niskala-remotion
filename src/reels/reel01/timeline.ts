import { SCENE_IDS, type ReelTiming } from "../contract/timing-types";
import { MOTION, REEL } from "../tokens";

/**
 * Reel 01 timing comes from the recorded voice-over: each scene lasts
 * padIn + its VO + padOut, and text starts from cues inside that VO file.
 * `expectedSeconds` is only a sanity check, and a stand-in while a file is missing.
 */
export type SceneId =
  | "s1"
  | "s2"
  | "s3"
  | "s4"
  | "s5"
  | "s6"
  | "s7"
  | "s7b"
  | "s8a"
  | "s8b"
  | "s8c"
  | "s8d"
  | "s9"
  | "s10";

export type HookVariant = "stop" | "plain";

export type VoSpec = {
  id: SceneId;
  file: string;
  expectedSeconds: number;
  /** Seconds from the start of the file. */
  cues: readonly number[];
  padIn: number;
  padOut: number;
};

const PAD_IN = 4;
const PAD_OUT = 10;
const S3_PAD_OUT = 20;
const BLACK_BEAT_PAD_OUT = 6;
const END_CARD_HOLD = 45;
/** 9 f over the default, so "terus." holds for 15 f. */
const S4_PAD_OUT = 19;

const spec = (
  id: SceneId,
  file: string,
  expectedSeconds: number,
  cues: readonly number[],
  pads: { padIn?: number; padOut?: number } = {},
): VoSpec => ({ id, file, expectedSeconds, cues, padIn: pads.padIn ?? PAD_IN, padOut: pads.padOut ?? PAD_OUT });

/**
 * Pads are Reel01's cutting style, so they stay in the kit. The voice-over files and
 * the cue times inside them come from the timing sidecar.
 * S8's beats play back-to-back, so only the outer edges of the four files get padding.
 */
const PADS: Partial<Record<SceneId, { padIn?: number; padOut?: number }>> = {
  s2: { padOut: BLACK_BEAT_PAD_OUT },
  /* The longer pad lets the sink finish before the pan up. */
  s3: { padOut: S3_PAD_OUT },
  s4: { padOut: S4_PAD_OUT },
  s6: { padOut: BLACK_BEAT_PAD_OUT },
  s8a: { padOut: 0 },
  s8b: { padIn: 0, padOut: 0 },
  s8c: { padIn: 0, padOut: 0 },
  s8d: { padIn: 0 },
  s10: { padOut: END_CARD_HOLD },
};

/** Only the scenes the timing has, in Reel01's order: all 14 for Reel01, a subset for the flow preset. */
export const buildSpecs = (timing: ReelTiming): readonly VoSpec[] =>
  SCENE_IDS.flatMap((id) => {
    const vo = timing.scenes[id];
    return vo ? [spec(id, vo.file, vo.expectedSeconds, vo.cues, PADS[id])] : [];
  });

/** TODO_VO_HOOK_PLAIN: not recorded yet. The plain hook is the last hook line, shown from frame 0. */
const plainHookSpec = (timing: ReelTiming): VoSpec => {
  const s1 = timing.scenes.s1;
  if (!s1) {
    throw new Error("Timing has no scene s1");
  }
  return spec("s1", "vo_01_hook_plain.wav", s1.expectedSeconds - s1.cues[2], [0]);
};

export const specsFor = (variant: HookVariant, timing: ReelTiming): readonly VoSpec[] =>
  variant === "plain" ? buildSpecs(timing).map((item) => (item.id === "s1" ? plainHookSpec(timing) : item)) : buildSpecs(timing);

/** Frames are local to the scene, except `from`, which is its start on the reel. */
export type SceneTiming = {
  /** A SceneId in Reel01; other reels use their own ids. */
  id: string;
  file: string;
  /** No file yet: the scene uses expectedSeconds and plays no VO. */
  missing: boolean;
  from: number;
  durationInFrames: number;
  voFrom: number;
  voFrames: number;
  voEnd: number;
  cues: number[];
};

export type ReelTimeline = {
  /** Every scene of Reel01. A preset with fewer scenes (reel01-flow-v1) only has the ones in `order`; read only those. */
  scenes: Record<SceneId, SceneTiming>;
  /** Scene order, for walking them without relying on object key order. */
  order: SceneId[];
  totalFrames: number;
  /** Folder under public/ that holds the scene files. */
  voDir: string;
};

/** `seconds` holds the measured length of each file that exists. */
export function buildTimeline(
  variant: HookVariant,
  timing: ReelTiming,
  seconds: Partial<Record<SceneId, number>> = {},
): ReelTimeline {
  let from = 0;
  const scenes = {} as Record<SceneId, SceneTiming>;
  const order: SceneId[] = [];

  specsFor(variant, timing).forEach((item) => {
    const measured = seconds[item.id];
    const voFrames = Math.ceil((measured ?? item.expectedSeconds) * REEL.fps);
    const durationInFrames = item.padIn + voFrames + item.padOut;
    scenes[item.id] = {
      id: item.id,
      file: item.file,
      missing: measured === undefined,
      from,
      durationInFrames,
      voFrom: item.padIn,
      voFrames,
      voEnd: item.padIn + voFrames,
      cues: item.cues.map((cue) => item.padIn + Math.round(cue * REEL.fps)),
    };
    order.push(item.id);
    from += durationInFrames;
  });

  return { scenes, order, totalFrames: from, voDir: timing.voDir };
}

/** A line's first word may start this long before its cue, so text never lags the voice. */
export const CUE_LEAD = 3;
/** The brief's floor for a v2 hold; shorter is reported, never hidden by cropping. */
export const MIN_HOLD = 15;

export const cueStart = (scene: SceneTiming, cueIndex: number): number => scene.cues[cueIndex] - CUE_LEAD;

/** Each word's start frame, from its time in the VO file. */
export const voiceStarts = (scene: SceneTiming, seconds: readonly number[]): number[] =>
  seconds.map((second) => scene.voFrom + Math.round(second * REEL.fps) - CUE_LEAD);

const MIN_WORD_GAP = 3;
/** How long after settling a sentenceCamera finishes pulling back, which is where its hold starts. */
export const CAMERA_SETTLE = MOTION.pullBack - MOTION.pullBackOverlap;

/**
 * Keeps the voice's rhythm but squeezes it towards the first word, so the line
 * can hold MIN_HOLD before `holdEnd`. Words only ever move earlier. Word gaps
 * stop at 3 f, so a phrase too short to fit is reported as a short hold.
 */
export function fitToHold(starts: readonly number[], holdEnd: number, afterSettle = 0): number[] {
  const first = starts[0];
  const last = starts[starts.length - 1];
  const latest = holdEnd - MIN_HOLD - afterSettle - MOTION.wordIn;
  if (last <= latest || last === first) {
    return [...starts];
  }
  const scale = Math.max(0, latest - first) / (last - first);
  const fitted: number[] = [];
  starts.forEach((start, index) => {
    const scaled = first + Math.round((start - first) * scale);
    fitted.push(index === 0 ? first : Math.min(start, Math.max(scaled, fitted[index - 1] + MIN_WORD_GAP)));
  });
  return fitted;
}

/** A phrase starts leaving this long before the next one starts, so it stays up while its last word is spoken. */
export const PHRASE_HANDOVER = 4;

/** About -18 dB as a linear gain. */
const MUSIC_DUCKED = Math.pow(10, -18 / 20);
const MUSIC_RAMP = 6;

/** Full between lines and in the end-card hold, ducked under every VO file. */
export function musicVolume(frame: number, timeline: ReelTimeline): number {
  let duck = 0;
  timeline.order.forEach((id) => {
    const scene = timeline.scenes[id];
    const start = scene.from + scene.voFrom;
    const end = scene.from + scene.voEnd;
    const into = (frame - (start - MUSIC_RAMP)) / MUSIC_RAMP;
    const outOf = (end + MUSIC_RAMP - frame) / MUSIC_RAMP;
    duck = Math.max(duck, Math.min(1, into, outOf));
  });
  return 1 + (MUSIC_DUCKED - 1) * Math.max(0, duck);
}
