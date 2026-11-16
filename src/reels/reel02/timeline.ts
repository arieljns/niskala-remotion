import { REEL } from "../tokens";
import type { SceneTiming } from "../reel01/timeline";

/**
 * Reel 02 has one VO file, so every scene is a window onto it: a scene's
 * `voFrom` is where the VO's second 0 falls in the scene's local frames
 * (negative after the first scene). That keeps Reel01's word-timing helpers
 * (voiceStarts, fitToHold, buildHeadlines, useBlackBeat) working unchanged.
 */
/** v1 (vo.mp3) with the re-recorded pengunjung line (vo_pengunjung.mp3) spliced in, and "Terus," cut from the gigit line. */
export const VO_FILE = "reels/vo_reel02/vo-v2.wav";
/** Measured: 38.428 s. */
export const VO_SECONDS = 38.43;
/** Notification burst before the voice: the camera is in close, then pulls out as "POV" starts. */
export const INTRO_FRAMES = 36;
/** VO starts this many frames into the reel. */
export const VO_OFFSET = INTRO_FRAMES + 4;
/** End card holds this long after the last word. */
const END_HOLD = 105;

export const VO_FRAMES = Math.ceil(VO_SECONDS * REEL.fps);
export const TOTAL_FRAMES = VO_OFFSET + VO_FRAMES + END_HOLD;

export type Reel02SceneId = "hook" | "drop" | "iklan" | "sepi" | "gigit" | "tulang" | "teaser" | "cta";

/** Each scene starts at this VO second (the hook at frame 0). */
const CUTS: readonly [Reel02SceneId, number][] = [
  ["hook", 0],
  ["drop", 3.05],
  ["iklan", 4.85],
  ["sepi", 10.4],
  ["gigit", 18.45],
  ["tulang", 25.0],
  ["teaser", 28.1],
  ["cta", 34.2],
];

/** Reel frame of a VO second. */
export const voFrame = (seconds: number): number => VO_OFFSET + Math.round(seconds * REEL.fps);

export type Reel02Timeline = Record<Reel02SceneId, SceneTiming>;

export function buildReel02Timeline(): Reel02Timeline {
  const scenes = {} as Reel02Timeline;
  CUTS.forEach(([id, second], index) => {
    const from = index === 0 ? 0 : voFrame(second);
    const next = CUTS[index + 1];
    const end = next ? voFrame(next[1]) : TOTAL_FRAMES;
    const durationInFrames = end - from;
    scenes[id] = {
      id,
      file: VO_FILE,
      missing: false,
      from,
      durationInFrames,
      voFrom: VO_OFFSET - from,
      voFrames: VO_FRAMES,
      voEnd: Math.min(durationInFrames, VO_OFFSET + VO_FRAMES - from),
      cues: [],
    };
  });
  return scenes;
}

/** Local frame (inside a scene) of a VO second. */
export const localFrame = (scene: SceneTiming, seconds: number): number => voFrame(seconds) - scene.from;
