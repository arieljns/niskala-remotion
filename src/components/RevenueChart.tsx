import { COLORS, easedInterpolate, withAlpha } from "../tokens";
import { fontFamily } from "../fonts";
import { useLayout } from "../useLayout";

interface RevenueChartProps {
  width: number;
  height: number;
  /** 0-1 overall reveal — bars grow, then the trend line draws on. */
  progress: number;
  /** Relative bar heights (not currency) — only the shape matters. */
  bars: number[];
  months: string[];
  label: string;
}

/**
 * The chunk-one payoff chart — a monthly-revenue bar chart that ramps up
 * with a trend line drawing over the top into an upward arrowhead. No
 * figures or percentages: it's a representation of revenue climbing, not a
 * data readout. Locked to the cream/ink/accent tokens.
 */
export function RevenueChart({ width, height, progress, bars, months, label }: RevenueChartProps) {
  const layout = useLayout();
  const p = Math.min(1, Math.max(0, progress));
  const n = bars.length;
  const max = Math.max(...bars);

  const headerH = layout.font.md * 1.7;
  const labelsH = layout.font.xs * 2;
  const plotTop = headerH;
  const plotH = Math.max(1, height - headerH - labelsH);
  const plotBottom = plotTop + plotH;
  const slot = width / n;
  const barW = slot * 0.58;

  const grow = (i: number) => {
    const start = (i / (n + 1)) * 0.8;
    return easedInterpolate(p, [start, start + 0.34], [0, 1]);
  };

  const tops = bars.map((v, i) => {
    const h = (v / max) * plotH * 0.82 * grow(i);
    return { x: slot * (i + 0.5), y: plotBottom - h };
  });

  // trend line runs through the bar tops, then breaks out past the last one
  const pts = tops.map((t) => [t.x, t.y] as [number, number]);
  const [lx, ly] = pts[n - 1];
  const [plx, ply] = pts[n - 2];
  const seg = Math.hypot(lx - plx, ly - ply) || 1;
  const dirX = (lx - plx) / seg;
  const dirY = (ly - ply) / seg;
  const ext = slot * 0.5;
  const breakout: [number, number] = [lx + dirX * ext, ly + dirY * ext];
  const linePts: [number, number][] = [...pts, breakout];
  const lineD = linePts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const areaD = `M ${pts.map(([x, y]) => `${x} ${y}`).join(" L ")} L ${pts[n - 1][0]} ${plotBottom} L ${pts[0][0]} ${plotBottom} Z`;
  let lineLen = 0;
  for (let i = 1; i < linePts.length; i++)
    lineLen += Math.hypot(linePts[i][0] - linePts[i - 1][0], linePts[i][1] - linePts[i - 1][1]);

  const lineProg = easedInterpolate(p, [0.12, 0.96], [0, 1]);
  const [ex, ey] = breakout;
  const ang = Math.atan2(dirY, dirX);
  const ah = Math.max(12, layout.baseUnit * 1.9);
  const arrow = `M ${ex + ah * Math.cos(ang) * 0.5} ${ey + ah * Math.sin(ang) * 0.5}
    L ${ex - ah * Math.cos(ang - 0.6)} ${ey - ah * Math.sin(ang - 0.6)}
    L ${ex - ah * Math.cos(ang + 0.6)} ${ey - ah * Math.sin(ang + 0.6)} Z`;
  const arrowIn = easedInterpolate(p, [0.92, 1], [0, 1]);

  const gridLines = [0.3, 0.6, 0.9].map((f) => plotBottom - plotH * 0.82 * f);

  return (
    <div style={{ position: "relative", width, height, fontFamily }}>
      <div style={{ position: "absolute", left: 0, top: 0, display: "flex", alignItems: "center", gap: layout.spacing.xs }}>
        <span style={{ fontSize: layout.font.md, fontWeight: 600, color: withAlpha(COLORS.ink, 0.72) }}>{label}</span>
        <span
          style={{
            fontSize: layout.font.xs,
            fontWeight: 700,
            color: COLORS.cream,
            background: COLORS.accent,
            padding: `${layout.spacing.xs * 0.4}px ${layout.spacing.xs}px`,
            borderRadius: 999,
            opacity: easedInterpolate(p, [0.55, 0.78], [0, 1]),
          }}
        >
          ▲ Meningkat
        </span>
      </div>

      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        {gridLines.map((y, i) => (
          <line key={i} x1={0} y1={y} x2={width} y2={y} stroke={withAlpha(COLORS.ink, 0.07)} strokeWidth={1} />
        ))}
        <path d={areaD} fill={withAlpha(COLORS.accent, 0.08)} opacity={lineProg} />
        <line
          x1={0}
          y1={plotBottom}
          x2={width}
          y2={plotBottom}
          stroke={withAlpha(COLORS.ink, 0.2)}
          strokeWidth={Math.max(1.5, layout.baseUnit * 0.1)}
        />
        {tops.map((t, i) => (
          <rect
            key={i}
            x={t.x - barW / 2}
            y={t.y}
            width={barW}
            height={Math.max(0, plotBottom - t.y)}
            rx={Math.min(barW / 2, layout.radius.sm * 0.6)}
            fill={
              i === n - 1
                ? COLORS.accent
                : i >= n - 3
                  ? withAlpha(COLORS.accent, 0.45)
                  : withAlpha(COLORS.ink, 0.13)
            }
          />
        ))}
        <path
          d={lineD}
          fill="none"
          stroke={COLORS.accent}
          strokeWidth={Math.max(2.5, layout.baseUnit * 0.32)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={lineLen}
          strokeDashoffset={lineLen * (1 - lineProg)}
        />
        <path d={arrow} fill={COLORS.accent} opacity={arrowIn} />
      </svg>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: labelsH, display: "flex", alignItems: "center" }}>
        {months.map((m, i) => (
          <span
            key={m + i}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: layout.font.xs * 0.9,
              fontWeight: 600,
              color: withAlpha(COLORS.ink, 0.5),
              opacity: grow(i),
            }}
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
