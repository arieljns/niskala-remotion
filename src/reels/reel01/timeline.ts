/**
 * Reel 01 scene boundaries in absolute frames. S3-S5 share one world and one
 * Sequence because the camera pans between them; S7-S9 likewise because the
 * dot, phone and closing question hand over with no cut.
 */
export const SCENES = {
  s1: { from: 0, durationInFrames: 84 },
  s2: { from: 84, durationInFrames: 42 },
  reasons: { from: 126, durationInFrames: 332 },
  s6: { from: 458, durationInFrames: 48 },
  solution: { from: 506, durationInFrames: 394 },
  s10: { from: 900, durationInFrames: 86 },
} as const;

export const REEL01_DURATION = SCENES.s10.from + SCENES.s10.durationInFrames;
