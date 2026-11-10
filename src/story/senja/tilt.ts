import { easedInterpolate } from "../../theme/motion";
import type { Layout } from "../../useLayout";

/**
 * Device tilt that settles to 0° as the scene's key moment lands. Capped at
 * ±7° in 16:9 and ±3° in 9:16 (DESIGN-SYSTEM.md §4.9, §6).
 */
export function settledTilt(frame: number, landFrame: number, degrees: number, layout: Layout, settleFrames = 20): number {
  const max = layout.isPortrait ? 3 : 7;
  const capped = Math.max(-max, Math.min(max, degrees));
  return capped * (1 - easedInterpolate(frame, [landFrame - settleFrames, landFrame], [0, 1]));
}
