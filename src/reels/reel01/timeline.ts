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

export const VO_DIR = "reels/vo_reels_1_el";

const spec = (
  id: SceneId,
  file: string,
  expectedSeconds: number,
  cues: readonly number[],
  pads: { padIn?: number; padOut?: number } = {},
): VoSpec => ({ id, file, expectedSeconds, cues, padIn: pads.padIn ?? PAD_IN, padOut: pads.padOut ?? PAD_OUT });

/** S8's beats play back-to-back, so only the outer edges of the four files get padding. */
export const VO_SPECS: readonly VoSpec[] = [
  spec("s1", "vo_01_hook.wav", 5.72, [0, 0.88, 2.63]),
  spec("s2", "vo_02_numpang.wav", 5.05, [0.05], { padOut: BLACK_BEAT_PAD_OUT }),
  /* The longer pad lets the sink finish before the pan up. */
  spec("s3", "vo_03_promo.wav", 1.91, [0.05, 0.99], { padOut: S3_PAD_OUT }),
  spec("s4", "vo_04_biaya.wav", 2.05, [0.05, 0.98], { padOut: S4_PAD_OUT }),
  /* Second cue: "Segitu-segitu" lands. */
  spec("s5", "vo_05_omzet.wav", 2.12, [0.05, 0.77]),
  spec("s6", "vo_06_untung.wav", 2.77, [0.05, 1.59], { padOut: BLACK_BEAT_PAD_OUT }),
  spec("s7", "vo_07_solusi.wav", 4.74, [0.05, 2.83]),
  spec("s7b", "vo_07b_bridge.wav", 2.66, [0.05, 1.65]),
  /* Third cue: ProductTagPill pops in, on "keranjang putih". */
  spec("s8a", "vo_08a_reveal.wav", 4.59, [0.05, 2.25, 3.3], { padOut: 0 }),
  spec("s8b", "vo_08b_tap.wav", 2.96, [0.05, 0.94], { padIn: 0, padOut: 0 }),
  spec("s8c", "vo_08c_syarat.wav", 2.39, [0.05, 1.14], { padIn: 0, padOut: 0 }),
  /* Second cue: the notification drops. */
  spec("s8d", "vo_08d_checkout.wav", 3.37, [0.05, 1.78], { padIn: 0 }),
  /* 4.14 s is measured from the file, not from the cue sheet: the last phrase's onset, for the buyer signals. */
  spec("s9", "vo_09_resolusi.wav", 6.01, [0.05, 1.65, 4.14]),
  /* 2.17 is the Follow card, 5.24 the URL bar. */
  spec("s10", "vo_10_cta.wav", 8.5, [0.05, 2.17, 5.24], { padOut: END_CARD_HOLD }),
];

/** TODO_VO_HOOK_PLAIN: not recorded yet. The plain hook is the last hook line, shown from frame 0. */
export const PLAIN_HOOK_SPEC: VoSpec = spec("s1", "vo_01_hook_plain.wav", 5.72 - 2.63, [0]);

export const specsFor = (variant: HookVariant): readonly VoSpec[] =>
  variant === "plain" ? VO_SPECS.map((item) => (item.id === "s1" ? PLAIN_HOOK_SPEC : item)) : VO_SPECS;

/** Frames are local to the scene, except `from`, which is its start on the reel. */
export type SceneTiming = {
  id: SceneId;
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
  scenes: Record<SceneId, SceneTiming>;
  /** Scene order, for walking them without relying on object key order. */
  order: SceneId[];
  totalFrames: number;
};

/** `seconds` holds the measured length of each file that exists. */
export function buildTimeline(variant: HookVariant, seconds: Partial<Record<SceneId, number>> = {}): ReelTimeline {
  let from = 0;
  const scenes = {} as Record<SceneId, SceneTiming>;
  const order: SceneId[] = [];

  specsFor(variant).forEach((item) => {
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

  return { scenes, order, totalFrames: from };
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
