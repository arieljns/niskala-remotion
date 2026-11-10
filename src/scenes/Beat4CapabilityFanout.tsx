import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SPRING_CONFIG, withAlpha } from "../tokens";
import { fontFamily } from "../fonts";
import { useLayout } from "../useLayout";
import { BrowserFrame } from "../components/BrowserFrame";
import { SellerDashboardMock } from "../components/mocks/SellerDashboardMock";
import { ICONS } from "../assets";

const FEATURES = [
  { label: "Lacak Omzet", icon: ICONS.chartLineUp },
  { label: "Kelola Pelanggan", icon: ICONS.peopleGroup },
  { label: "Kelola Pesanan", icon: ICONS.clipboard },
  { label: "Atur Pengiriman", icon: ICONS.truck },
];

/**
 * Beat 4 (300-420) — the seller dashboard scales in at centre and its four
 * capabilities (omzet tracking, customer management, order management,
 * shipping) ride a slow orbit around it: circular badges evenly spaced on
 * an elliptical ring, rotating together, passing in front of the frame as
 * they come round. Badges stay upright.
 */
export function Beat4CapabilityFanout() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();

  const frameIn = spring({ frame, fps, config: SPRING_CONFIG });
  const widthPct = layout.isPortrait ? 0.56 : 0.34;
  const { x: cx, y: cy } = layout.center;

  const rx = layout.isPortrait ? layout.width * 0.4 : layout.width * 0.31;
  const ry = layout.isPortrait ? layout.height * 0.26 : layout.height * 0.4;

  // radians/frame — a slow clockwise orbit (~a quarter turn across the beat)
  const spin = frame * 0.011;

  const disc = layout.icon.lg * (layout.isPortrait ? 1.7 : 1.9);

  return (
    <AbsoluteFill>
      {/* the orbit path */}
      <svg width={layout.width} height={layout.height} style={{ position: "absolute", inset: 0 }}>
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="none"
          stroke={withAlpha(COLORS.ink, 0.12)}
          strokeWidth={Math.max(1.5, layout.baseUnit * 0.12)}
          opacity={frameIn}
        />
      </svg>

      {/* the seller dashboard */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `scale(${0.82 + frameIn * 0.18})`, opacity: frameIn }}>
          <BrowserFrame widthPct={widthPct} showBrowserIcon>
            <SellerDashboardMock />
          </BrowserFrame>
        </div>
      </AbsoluteFill>

      {/* circular capability badges orbiting the dashboard */}
      {FEATURES.map((f, i) => {
        const entrance = spring({ frame: frame - 14 - i * 6, fps, config: SPRING_CONFIG });
        const a = spin + (i / FEATURES.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * rx;
        const y = cy + Math.sin(a) * ry;
        // a touch of depth: badges at the front (lower) sit slightly larger
        const depth = 0.9 + ((Math.sin(a) + 1) / 2) * 0.16;
        return (
          <div
            key={f.label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${depth * (0.7 + entrance * 0.3)})`,
              opacity: entrance,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: layout.spacing.xs,
            }}
          >
            <div
              style={{
                width: disc,
                height: disc,
                borderRadius: "50%",
                background: COLORS.cream,
                border: `${Math.max(2, layout.baseUnit * 0.14)}px solid ${withAlpha(COLORS.ink, 0.14)}`,
                boxShadow: `0 ${layout.baseUnit * 0.7}px ${layout.baseUnit * 1.6}px ${withAlpha(COLORS.ink, 0.1)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Img src={f.icon} style={{ width: "48%", height: "48%" }} />
            </div>
            <span
              style={{
                fontFamily,
                fontSize: layout.font.xs,
                fontWeight: 700,
                color: COLORS.ink,
                whiteSpace: "nowrap",
              }}
            >
              {f.label}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
