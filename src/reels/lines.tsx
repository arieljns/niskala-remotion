import { evolvePath, getLength, getPointAtLength } from "@remotion/paths";
import { interpolate, random, useCurrentFrame } from "remotion";
import { COLORS, EASINGS } from "./tokens";
import type { Box } from "./wordLayout";

/** Thin enough that the many small moves of a price chart stay legible. */
const STROKE = 9;
const TIP_RADIUS = 14;

type Point = { x: number; y: number };

/** A straight-segment path through the points, the way a price chart is drawn. */
export function chartPath(points: readonly Point[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

const Line: React.FC<{
  d: string;
  bounds: Box;
  stroke: string;
  strokeDasharray?: string;
  strokeDashoffset?: number;
  style?: React.CSSProperties;
}> = ({ d, bounds, stroke, strokeDasharray, strokeDashoffset, style }) => (
  <svg
    viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
    style={{
      position: "absolute",
      left: bounds.x,
      top: bounds.y,
      width: bounds.width,
      height: bounds.height,
      overflow: "visible",
      ...style,
    }}
  >
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={strokeDasharray}
      strokeDashoffset={strokeDashoffset}
    />
  </svg>
);

/**
 * A believable price path between two points: the trend bends by `curve` (1 is
 * straight, higher stays flat longer and then spikes) with fine and coarse
 * noise on top. Illustrates a shape only; it is not data. Seeded, so every
 * frame and every render gets the same path.
 */
export function priceSeries({
  seed,
  from,
  to,
  count,
  noise,
  curve,
}: {
  seed: string;
  from: Point;
  to: Point;
  count: number;
  noise: number;
  curve: number;
}): Point[] {
  return new Array(count).fill(0).map((_, index) => {
    const t = index / (count - 1);
    const trend = from.y + (to.y - from.y) * Math.pow(t, curve);
    const fine = (random(`${seed}-fine-${index}`) - 0.5) * noise;
    const coarse = (random(`${seed}-coarse-${Math.floor(index / 5)}`) - 0.5) * noise * 1.4;
    // Pinned at both ends so the path starts and lands exactly where it was placed.
    const pin = Math.min(1, t * 8, (1 - t) * 14);
    return { x: from.x + (to.x - from.x) * t, y: trend + (fine + coarse) * pin };
  });
}

/** Tight box around a path, with room for the stroke and marker. */
export function pointsBounds(points: readonly Point[], padding: number): Box {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs) - padding;
  const y = Math.min(...ys) - padding;
  return { x, y, width: Math.max(...xs) + padding - x, height: Math.max(...ys) + padding - y };
}

export function lineProgress(frame: number, startFrame: number, durationInFrames: number): number {
  return interpolate(frame, [startFrame, startFrame + durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.camera,
  });
}

/** Where the drawn line ends at `progress`, so the camera can chase it. */
export function lineTip(d: string, progress: number): { x: number; y: number } {
  const point = getPointAtLength(d, getLength(d) * progress);
  if (!point) {
    throw new Error(`No point on line at progress ${progress}`);
  }
  return point;
}

/**
 * A price chart climbing: faint gridlines and a filled area revealed with the
 * line, a glow on the line and a marker on its tip. No axis labels or numbers.
 */
export const RisingLine: React.FC<{
  points: readonly Point[];
  bounds: Box;
  startFrame: number;
  durationInFrames: number;
}> = ({ points, bounds, startFrame, durationInFrames }) => {
  const frame = useCurrentFrame();
  const progress = lineProgress(frame, startFrame, durationInFrames);
  if (progress <= 0) {
    return null;
  }
  const d = chartPath(points);
  const { strokeDasharray, strokeDashoffset } = evolvePath(progress, d);
  const tip = lineTip(d, progress);
  const baseY = Math.max(...points.map((point) => point.y)) + 8;
  const first = points[0];
  const last = points[points.length - 1];
  const areaD = `${d} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
  const clipId = `rising-line-clip-${startFrame}`;
  const fillId = `rising-line-fill-${startFrame}`;
  const gridYs = [0, 0.25, 0.5, 0.75].map((share) => last.y + (baseY - last.y) * share);

  return (
    <svg
      viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
      style={{
        position: "absolute",
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        overflow: "visible",
      }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={bounds.x} y={bounds.y} width={tip.x - bounds.x} height={bounds.height} />
        </clipPath>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.accent} stopOpacity={0.32} />
          <stop offset="100%" stopColor={COLORS.accent} stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {gridYs.map((y) => (
          <line key={y} x1={first.x} x2={last.x} y1={y} y2={y} stroke={COLORS.ink} strokeOpacity={0.08} strokeWidth={2} />
        ))}
        <path d={areaD} fill={`url(#${fillId})`} />
        <line x1={first.x} x2={last.x} y1={baseY} y2={baseY} stroke={COLORS.ink} strokeOpacity={0.3} strokeWidth={3} />
      </g>
      <path
        d={d}
        fill="none"
        stroke={COLORS.accent}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        style={{ filter: "drop-shadow(0 0 18px rgba(224,83,62,.6))" }}
      />
      <circle cx={tip.x} cy={tip.y} r={TIP_RADIUS * 1.9} fill={COLORS.accent} fillOpacity={0.22} />
      <circle cx={tip.x} cy={tip.y} r={TIP_RADIUS} fill={COLORS.accent} />
    </svg>
  );
};

export const FLAT_LINE_FRAMES = 21;
/** Frame of first contact, where the drop bottoms out: the shake belongs here. */
export const FLAT_LINE_CONTACT = 10;

const CLAMP_BRAND = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASINGS.brand } as const;

export const FlatLine: React.FC<{ d: string; bounds: Box; startFrame: number }> = ({ d, bounds, startFrame }) => {
  const frame = useCurrentFrame();
  if (frame < startFrame) {
    return null;
  }
  const local = frame - startFrame;

  return (
    <Line
      d={d}
      bounds={bounds}
      stroke={COLORS.ink}
      style={{
        opacity: 0.55 * interpolate(local, [0, 3], [0, 1], CLAMP_BRAND),
        translate: `0px ${interpolate(local, [0, FLAT_LINE_CONTACT, 16, FLAT_LINE_FRAMES], [-500, 40, -15, 0], CLAMP_BRAND)}px`,
      }}
    />
  );
};
