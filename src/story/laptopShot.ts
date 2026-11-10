import type { Layout } from "../useLayout";
import { LAPTOP_SCREEN_ORIGIN } from "./components/LaptopFrame";

/**
 * A laptop camera framing in screen terms: `cx, cy` is the point on the
 * 1210x756 screen to frame, `span` how many laptop units fit across the
 * viewport. Small spans crop into a region (portrait), large spans show the
 * whole device (landscape).
 */
export type LaptopShot = { cx: number; cy: number; span: number; anchorY?: number };

/** The whole laptop with a margin, as a LaptopShot. */
export const WHOLE_LAPTOP: LaptopShot = { cx: 605, cy: 380, span: 1380 / 0.8 };

/** Eases between two shots and returns Camera props (in laptop coordinates). */
export function laptopCamera(from: LaptopShot, to: LaptopShot, t: number, viewportWidth: number) {
  const lerp = (a: number, b: number) => a + (b - a) * t;
  // Interpolate span in log space so the zoom feels even.
  const span = Math.exp(lerp(Math.log(from.span), Math.log(to.span)));
  return {
    focusX: LAPTOP_SCREEN_ORIGIN.x + lerp(from.cx, to.cx),
    focusY: LAPTOP_SCREEN_ORIGIN.y + lerp(from.cy, to.cy),
    scale: viewportWidth / span,
    anchorY: lerp(from.anchorY ?? 0.45, to.anchorY ?? 0.45),
  };
}

/** Picks the landscape or portrait variant of a shot pair. */
export function byOrientation<T>(layout: Layout, landscape: T, portrait: T): T {
  return layout.isPortrait ? portrait : landscape;
}
