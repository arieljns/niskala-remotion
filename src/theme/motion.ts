import { Easing, interpolate } from "remotion";

/**
 * Motion helpers shared by both layers (no colours here). The curve is the
 * same in Senja and the client UI: cubic-bezier(0.32, 0.72, 0, 1).
 */
export const EASE = Easing.bezier(0.32, 0.72, 0, 1);

/** `interpolate()` with EASE and clamping, the default for every non-spring move. */
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

/** Spring for small UI events only (bubbles, stars, badges, ripples, sticker tags). */
export const STORY_SPRING = {
  damping: 18,
  mass: 0.8,
} as const;

/** Hex colour → rgba() at the given alpha. */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
