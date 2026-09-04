import { Easing, interpolate } from "remotion";

/**
 * Shared across all three package-explainer compositions. Locked palette —
 * every fill in these videos comes from here, no gradients, no ad-hoc hex
 * values. Matches the live site's cream/ink/sienna tokens
 * (src/app/globals.css in the main repo): --bg-primary, --text-primary,
 * --accent-primary.
 */
export const COLORS = {
  cream: "#F7F3EA",
  ink: "#2B2620",
  accent: "#E8562A",
} as const;

/**
 * The one motion curve used everywhere in these videos — matches the site's
 * locked `--ease-fluid` (cubic-bezier(0.32, 0.72, 0, 1)). Never use
 * Remotion's default (linear/easeInOut) easing in an `interpolate()` call in
 * this project; always pass `EASE`, or use `easedInterpolate` below.
 */
export const EASE = Easing.bezier(0.32, 0.72, 0, 1);

/**
 * `interpolate()` with `EASE` and clamped extrapolation baked in — the
 * default every animation in this project should reach for. Pass
 * `{ extrapolateLeft, extrapolateRight }` in `options` to override clamping
 * on either end if a specific animation genuinely needs to.
 */
export function easedInterpolate(
  frame: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  options?: Parameters<typeof interpolate>[3],
) {
  return interpolate(frame, inputRange, outputRange, {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    ...options,
  });
}

/** Every composition in this project is exactly 5 seconds. */
export const VIDEO_DURATION_SECONDS = 5;

export function getDurationInFrames(fps: number): number {
  return Math.round(VIDEO_DURATION_SECONDS * fps);
}

/**
 * The 3 hard-cut beat boundaries, in seconds: 0–1.8, 1.8–3.4, 3.4–5.0.
 * `getBeatFrames` converts to frame numbers for a given fps and returns the
 * 4 boundary points (start of beat 1, start of beat 2, start of beat 3, end)
 * — consume with `<HardCut>` (see HardCut.tsx), never with a crossfade.
 */
const BEAT_BOUNDARIES_SECONDS = [0, 1.8, 3.4, VIDEO_DURATION_SECONDS] as const;

export type BeatFrames = readonly [number, number, number, number];

export function getBeatFrames(fps: number): BeatFrames {
  return BEAT_BOUNDARIES_SECONDS.map((s) => Math.round(s * fps)) as unknown as BeatFrames;
}

/**
 * Shared render dimensions per aspect ratio — reused by all 3 compositions.
 * `widescreen` (not square) for the desktop card embed: the actual
 * /layanan TierCard slot is built with Tailwind's `aspect-video` (16:9) —
 * see src/components/layanan/TierCard.tsx in the main repo — so the
 * composition matches the real card, not an assumed 1:1.
 */
export const ASPECT_RATIOS = {
  widescreen: { width: 1920, height: 1080, suffix: "widescreen" },
  portrait: { width: 1080, height: 1920, suffix: "portrait" },
} as const;

export type AspectRatioId = keyof typeof ASPECT_RATIOS;
