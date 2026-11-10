import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SPRING_CONFIG, withAlpha } from "../tokens";
import { fontFamily } from "../fonts";
import { useLayout } from "../useLayout";
import { RevenueChart } from "../components/RevenueChart";
import { LOGOS } from "../assets";

/** Relative bar heights only — a ramping shape, deliberately not figures. */
const BARS = [16, 24, 34, 48, 66, 84, 100];
const MONTHS = ["Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags"];

/**
 * Beat 6 (540-660) — the payoff: a monthly-revenue bar chart ramps up with
 * a trend line drawing over it into an upward arrowhead (revenue climbing
 * hard, no figures — the "Simulasi" caption stays up the whole time), then
 * the chart dims back and the Niskala logo lands centre-frame as the
 * sign-off / hand-off into chunk 2.
 */
export function Beat6Outcome({ durationInFrames }: { durationInFrames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();

  // near-linear so the climb builds steadily across the beat
  const progress = interpolate(frame, [6, durationInFrames * 0.56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chartWidth = layout.isPortrait ? layout.width * 0.84 : layout.width * 0.52;
  const chartHeight = chartWidth * (layout.isPortrait ? 0.78 : 0.52);

  // logo sign-off
  const cardStart = durationInFrames - 40;
  const cardIn = spring({ frame: frame - cardStart, fps, config: SPRING_CONFIG });
  const chartFade = interpolate(frame, [cardStart, cardStart + 14], [1, 0.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const markSize = layout.icon.lg * (layout.isPortrait ? 1.6 : 1.9);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          opacity: chartFade,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: layout.spacing.lg,
        }}
      >
        <RevenueChart
          width={chartWidth}
          height={chartHeight}
          progress={progress}
          bars={BARS}
          months={MONTHS}
          label="Pendapatan Bulanan"
        />
        <span style={{ fontFamily, fontSize: layout.font.xs, color: withAlpha(COLORS.ink, 0.6) }}>
          Simulasi — ilustrasi, bukan data aktual
        </span>
      </div>

      {frame >= cardStart && (
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "center",
            gap: layout.spacing.md,
            transform: `scale(${0.82 + cardIn * 0.18})`,
            opacity: cardIn,
          }}
        >
          <Img src={LOGOS.niskalaMark} style={{ width: markSize, height: markSize, display: "block" }} />
          <span
            style={{
              fontFamily,
              fontSize: markSize * 0.86,
              // 800 is the one weight the design system reserves for the
              // display-1 wordmark — this end-card lockup is exactly that.
              fontWeight: 800,
              color: COLORS.ink,
            }}
          >
            Niskala
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
}
