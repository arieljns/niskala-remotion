import { useVideoConfig } from "remotion";

/**
 * Everything in src/ChunkOne.tsx and its scenes/components reads sizing and
 * arrangement from this hook instead of the raw width/height — the same
 * component tree renders correctly at both 1920x1080 (ChunkOneDesktop) and
 * 1080x1920 (ChunkOneMobile) because every number here is derived from the
 * canvas, never hardcoded per composition.
 */
export type Orientation = "landscape" | "portrait";

export interface Layout {
  width: number;
  height: number;
  orientation: Orientation;
  isPortrait: boolean;
  /** Math.min(width, height) / 100 — the single scale unit everything else is derived from. */
  baseUnit: number;
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
  font: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number; display: number };
  icon: { sm: number; md: number; lg: number };
  /** rounded-xl equivalent, scaled off baseUnit rather than a fixed px value. */
  radius: { sm: number; md: number; lg: number };
  center: { x: number; y: number };
  /** Safe max width for a block of body copy / a headline, per orientation. */
  maxContentWidth: number;
}

export function useLayout(): Layout {
  const { width, height } = useVideoConfig();
  const orientation: Orientation = height > width ? "portrait" : "landscape";
  const isPortrait = orientation === "portrait";
  const baseUnit = Math.min(width, height) / 100;

  return {
    width,
    height,
    orientation,
    isPortrait,
    baseUnit,
    spacing: {
      xs: baseUnit * 0.6,
      sm: baseUnit * 1.1,
      md: baseUnit * 2,
      lg: baseUnit * 3.2,
      xl: baseUnit * 4.8,
      xxl: baseUnit * 7,
    },
    font: {
      xs: baseUnit * 1.6,
      sm: baseUnit * 2,
      md: baseUnit * 2.6,
      lg: baseUnit * 3.4,
      xl: baseUnit * 4.6,
      xxl: baseUnit * 6.2,
      display: baseUnit * 7.6,
    },
    icon: {
      sm: baseUnit * 2.2,
      md: baseUnit * 3.2,
      lg: baseUnit * 4.6,
    },
    radius: {
      sm: baseUnit * 1,
      md: baseUnit * 1.6,
      lg: baseUnit * 2.4,
    },
    center: { x: width / 2, y: height / 2 },
    maxContentWidth: width * (isPortrait ? 0.9 : 0.82),
  };
}

/**
 * Positions `count` items around `center`, spanning `spread` px, in one of
 * three arrangements. Landscape scenes use "row" for fan-out elements;
 * portrait scenes swap to "column" (capability fan-out) or "triangle"
 * (the tighter chaos-open cluster) per the brief's per-orientation rules.
 * "triangle" always returns (at most) 3 points regardless of `count`.
 */
export function getFanPositions(
  count: number,
  arrangement: "row" | "column" | "triangle",
  center: { x: number; y: number },
  spread: number,
): { x: number; y: number }[] {
  if (arrangement === "triangle") {
    const dx = spread * 0.42;
    const dy = spread * 0.32;
    return [
      { x: center.x, y: center.y - dy },
      { x: center.x - dx, y: center.y + dy },
      { x: center.x + dx, y: center.y + dy },
    ].slice(0, count);
  }

  const axis = arrangement === "row" ? "x" : "y";
  const step = count > 1 ? spread / (count - 1) : 0;
  const start = center[axis] - spread / 2;

  return Array.from({ length: count }, (_, i) => {
    const value = count > 1 ? start + step * i : center[axis];
    return arrangement === "row" ? { x: value, y: center.y } : { x: center.x, y: value };
  });
}

/**
 * Where Beat 1's single shopping bag sits, and Beat 3/Beat 1's website
 * frame. Shared by Beat1ChaosOpen and Beat2Migration so the migration
 * trails start from exactly where the bag / its customer swarm was.
 * Landscape puts the bag left of centre and the site right; portrait
 * stacks bag-over-site.
 */
export function getBagAnchor(layout: Layout): { x: number; y: number } {
  return layout.isPortrait
    ? { x: layout.center.x, y: layout.height * 0.24 }
    : { x: layout.width * 0.29, y: layout.center.y };
}

export function getSiteAnchor(layout: Layout): { x: number; y: number } {
  return layout.isPortrait
    ? { x: layout.center.x, y: layout.height * 0.62 }
    : { x: layout.width * 0.69, y: layout.center.y };
}

/**
 * Point at `t` (0-1) along a quadratic-bezier arc from `from` to `to`, bowed
 * perpendicular to the straight line by `bow` px. Used by Beat2Migration to
 * curve each ParticleDot from its source chip (computed via
 * `getFanPositions`, so it's correct in both orientations) toward the
 * LogoMark gate at canvas center.
 */
export function arcPoint(
  from: { x: number; y: number },
  to: { x: number; y: number },
  t: number,
  bow: number,
): { x: number; y: number } {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const cx = mx + nx * bow;
  const cy = my + ny * bow;
  const u = 1 - t;

  return {
    x: u * u * from.x + 2 * u * t * cx + t * t * to.x,
    y: u * u * from.y + 2 * u * t * cy + t * t * to.y,
  };
}

/**
 * The fixed caption safe area for the NiskalaStory series. Landscape puts the
 * caption in a centred band near the bottom; portrait lifts it into the lower
 * third so it clears the platform UI that sits over the bottom of vertical
 * video. `bottom` is the distance from the canvas bottom edge to the
 * caption's baseline box.
 */
export function getCaptionArea(layout: Layout): { bottom: number; maxWidth: number; fontSize: number } {
  return layout.isPortrait
    ? { bottom: layout.height * 0.2, maxWidth: layout.width * 0.86, fontSize: layout.font.lg }
    : { bottom: layout.height * 0.07, maxWidth: layout.width * 0.62, fontSize: layout.font.lg };
}
