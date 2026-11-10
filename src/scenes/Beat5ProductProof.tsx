import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, easedInterpolate, SPRING_CONFIG, withAlpha } from "../tokens";
import { fontFamily } from "../fonts";
import { useLayout } from "../useLayout";

const CUSTOMERS = [
  { name: "Rina Anggraini", initials: "RA", note: "Pesanan terakhir 2 hari lalu", stage: "Pelanggan Setia" },
  { name: "Budi Santoso", initials: "BS", note: "Baru saja checkout", stage: "Pesanan Berulang" },
  { name: "Sarah Kusuma", initials: "SK", note: "Bergabung minggu ini", stage: "Pelanggan Baru" },
];

const STAGE_STYLE = [
  { bg: COLORS.accent, fg: COLORS.cream },
  { bg: withAlpha(COLORS.accent, 0.16), fg: COLORS.accent },
  { bg: withAlpha(COLORS.ink, 0.08), fg: withAlpha(COLORS.ink, 0.7) },
];

/**
 * Beat 5 (420-540) — the CRM mockup: a customer-relationship card (contact
 * list with avatars, activity notes and lifecycle-stage pills) morphs into
 * a circle that stamps a single large checkmark, then "Pelanggan Terlayani"
 * lands beneath it.
 */
export function Beat5ProductProof() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();

  const entrance = spring({ frame, fps, config: SPRING_CONFIG });

  // rectangle → circle over frames 34–58
  const morph = easedInterpolate(frame, [34, 58], [0, 1]);
  const circleSize = layout.isPortrait ? layout.width * 0.62 : layout.height * 0.54;
  const rectW = layout.isPortrait ? layout.width * 0.86 : layout.width * 0.56;
  const width = interpolate(morph, [0, 1], [rectW, circleSize]);
  const radius = interpolate(morph, [0, 1], [layout.radius.lg, circleSize / 2]);

  const cardOpacity = easedInterpolate(frame, [28, 40], [1, 0]);
  const checkScale = spring({ frame: frame - 50, fps, config: SPRING_CONFIG });
  const checkDraw = easedInterpolate(frame, [54, 72], [0, 1]);
  const labelIn = spring({ frame: frame - 66, fps, config: SPRING_CONFIG });

  const border = `${Math.max(2, layout.baseUnit * 0.14)}px solid ${withAlpha(COLORS.ink, 0.14)}`;
  const avatar = layout.icon.md * 1.1;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: layout.spacing.lg }}>
      <div
        style={{
          width,
          height: circleSize,
          borderRadius: radius,
          background: COLORS.cream,
          border,
          boxShadow: `0 ${layout.baseUnit * 1.4}px ${layout.baseUnit * 4}px ${withAlpha(COLORS.ink, 0.12)}`,
          transform: `translateY(${(1 - entrance) * layout.spacing.xl}px) scale(${0.9 + entrance * 0.1})`,
          opacity: entrance,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* phase 1 — the CRM card */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: layout.spacing.md,
            padding: `${layout.spacing.lg}px ${layout.spacing.xl}px`,
            opacity: cardOpacity,
          }}
        >
          <div style={{ display: "flex", gap: layout.spacing.xs * 0.6 }}>
            {[0, 1, 2].map((d) => (
              <div
                key={d}
                style={{ width: layout.baseUnit, height: layout.baseUnit, borderRadius: "50%", background: withAlpha(COLORS.ink, 0.22) }}
              />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: layout.spacing.xs }}>
            <span style={{ fontFamily, fontSize: layout.font.sm, fontWeight: 600, color: COLORS.ink }}>Pelanggan</span>
            <span style={{ fontFamily, fontSize: layout.font.xs, color: withAlpha(COLORS.ink, 0.5) }}>· 1.204 kontak</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {CUSTOMERS.map((c, i) => (
              <div
                key={c.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: layout.spacing.sm,
                  padding: `${layout.spacing.sm}px 0`,
                  borderBottom: i < CUSTOMERS.length - 1 ? `1px solid ${withAlpha(COLORS.ink, 0.08)}` : "none",
                }}
              >
                <div
                  style={{
                    width: avatar,
                    height: avatar,
                    flexShrink: 0,
                    borderRadius: "50%",
                    background: withAlpha(COLORS.accent, 0.14),
                    color: COLORS.accent,
                    fontFamily,
                    fontSize: layout.font.xs,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {c.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: layout.spacing.xs * 0.25 }}>
                  <span style={{ fontFamily, fontSize: layout.font.xs, fontWeight: 700, color: COLORS.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.name}
                  </span>
                  <span style={{ fontFamily, fontSize: layout.font.xs * 0.82, color: withAlpha(COLORS.ink, 0.5), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.note}
                  </span>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    fontFamily,
                    fontSize: layout.font.xs * 0.9,
                    fontWeight: 700,
                    color: STAGE_STYLE[i].fg,
                    background: STAGE_STYLE[i].bg,
                    padding: `${layout.spacing.xs * 0.4}px ${layout.spacing.xs}px`,
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.stage}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* phase 2 — the completion check */}
        <svg viewBox="0 0 100 100" style={{ width: "48%", height: "48%", transform: `scale(${checkScale})` }}>
          <circle cx="50" cy="50" r="46" fill={COLORS.accent} />
          <path
            d="M27 51 L44 68 L74 33"
            fill="none"
            stroke={COLORS.cream}
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - checkDraw}
          />
        </svg>
      </div>

      <span
        style={{
          fontFamily,
          fontSize: layout.font.lg,
          fontWeight: 700,
          color: COLORS.ink,
          opacity: labelIn,
          transform: `translateY(${(1 - labelIn) * layout.spacing.sm}px)`,
        }}
      >
        Pelanggan Terlayani
      </span>
    </AbsoluteFill>
  );
}
