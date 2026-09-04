import { COLORS } from "../tokens";
import { FlatShape } from "./FlatShape";

/**
 * The flat rectangle "report card" from the Pantau spec (4b) — reused in
 * Kendali too since both reference an updating dashboard/report. Its trend
 * line is a plain 4-point polyline (not a curve), so its length is just a
 * sum of segment distances — no DOM `getTotalLength()` ref needed. Pass
 * `lineProgress` from 0 (undrawn) to 1 (fully drawn) to animate the
 * strokeDashoffset "draw on" effect described in beat 2.
 */
export function ReportCardIcon({
  width = 220,
  height = 140,
  lineProgress = 1,
  cardFill = COLORS.cream,
  borderColor = COLORS.ink,
  lineColor = COLORS.accent,
}: {
  width?: number;
  height?: number;
  /** 0 = undrawn, 1 = fully drawn. */
  lineProgress?: number;
  cardFill?: string;
  borderColor?: string;
  lineColor?: string;
}) {
  const points: [number, number][] = [
    [width * 0.12, height * 0.78],
    [width * 0.38, height * 0.5],
    [width * 0.6, height * 0.62],
    [width * 0.88, height * 0.22],
  ];
  const pathD = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const totalLength = polylineLength(points);
  const drawn = totalLength * lineProgress;

  return (
    <div style={{ position: "relative", width, height }}>
      <FlatShape
        kind="roundedRect"
        width={width}
        height={height}
        fill={cardFill}
        stroke={borderColor}
        strokeWidth={3}
        cornerRadius={16}
      />
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", top: 0, left: 0 }}
        aria-hidden="true"
      >
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={totalLength}
          strokeDashoffset={totalLength - drawn}
        />
      </svg>
    </div>
  );
}

function polylineLength(points: [number, number][]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    length += Math.hypot(x2 - x1, y2 - y1);
  }
  return length;
}
