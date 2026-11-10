import { Img } from "remotion";
import { COLORS, withAlpha } from "../../tokens";
import { fontFamily } from "../../fonts";
import { useLayout } from "../../useLayout";
import { ICONS } from "../../assets";

const NAV = [
  { icon: ICONS.chartLineUp, label: "Ringkasan", active: true },
  { icon: ICONS.clipboard, label: "Pesanan" },
  { icon: ICONS.peopleGroup, label: "Pelanggan" },
  { icon: ICONS.truck, label: "Pengiriman" },
];

const STATS = [
  { label: "Pesanan Baru", value: "38" },
  { label: "Pelanggan", value: "1.204" },
  { label: "Dikirim", value: "27" },
];

const BARS = [0.42, 0.6, 0.5, 0.74, 0.66, 0.88, 0.8];

/**
 * Coded seller dashboard — a merchant back-office view (sidebar nav, an
 * omzet headline card, a weekly bar chart, quick stat tiles), built from
 * theme tokens and Manrope. Rendered inside the BrowserFrame in
 * Beat4CapabilityFanout with the four capability chips fanning out around
 * it.
 */
export function SellerDashboardMock() {
  const layout = useLayout();
  const pad = layout.spacing.md;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: COLORS.cream }}>
      {/* sidebar */}
      <div
        style={{
          width: "27%",
          flexShrink: 0,
          borderRight: `1px solid ${withAlpha(COLORS.ink, 0.1)}`,
          padding: layout.spacing.sm,
          display: "flex",
          flexDirection: "column",
          gap: layout.spacing.xs * 0.8,
        }}
      >
        {/* the "Niskala" wordmark — the one place the design system keeps 800 outside proof stats */}
        <span
          style={{
            fontFamily,
            fontSize: layout.font.sm,
            fontWeight: 800,
            color: COLORS.ink,
            marginBottom: layout.spacing.xs,
          }}
        >
          Niskala
        </span>
        {NAV.map((n) => (
          <div
            key={n.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: layout.spacing.xs,
              padding: `${layout.spacing.xs * 0.6}px ${layout.spacing.xs}px`,
              borderRadius: layout.radius.sm,
              background: n.active ? withAlpha(COLORS.accent, 0.14) : "transparent",
            }}
          >
            <Img
              src={n.icon}
              style={{
                width: layout.icon.sm,
                height: layout.icon.sm,
                flexShrink: 0,
                opacity: n.active ? 1 : 0.55,
              }}
            />
            <span
              style={{
                fontFamily,
                fontSize: layout.font.xs,
                fontWeight: n.active ? 700 : 500,
                color: n.active ? COLORS.accent : withAlpha(COLORS.ink, 0.7),
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {n.label}
            </span>
          </div>
        ))}
      </div>

      {/* main */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: pad,
          display: "flex",
          flexDirection: "column",
          gap: layout.spacing.sm,
        }}
      >
        <span style={{ fontFamily, fontSize: layout.font.sm, fontWeight: 600, color: COLORS.ink }}>Ringkasan Toko</span>

        {/* omzet headline */}
        <div
          style={{
            borderRadius: layout.radius.md,
            background: COLORS.ink,
            padding: pad,
            display: "flex",
            flexDirection: "column",
            gap: layout.spacing.xs * 0.5,
          }}
        >
          <span style={{ fontFamily, fontSize: layout.font.xs, color: withAlpha(COLORS.cream, 0.7) }}>Omzet bulan ini</span>
          {/* proof-stat number — one of the two contexts the design system keeps at 800 */}
          <span style={{ fontFamily, fontSize: layout.font.lg, fontWeight: 800, color: COLORS.cream }}>Rp 82,4 jt</span>
          <span style={{ fontFamily, fontSize: layout.font.xs, fontWeight: 700, color: COLORS.accent }}>
            ▲ 18% dari bulan lalu
          </span>
        </div>

        {/* weekly bar chart */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "flex-end",
            gap: layout.spacing.xs,
            padding: `${layout.spacing.xs}px 0`,
          }}
        >
          {BARS.map((b, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${b * 100}%`,
                borderRadius: layout.radius.sm * 0.5,
                background: i === BARS.length - 1 ? COLORS.accent : withAlpha(COLORS.ink, 0.16),
              }}
            />
          ))}
        </div>

        {/* quick stat tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: layout.spacing.xs }}>
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{ borderRadius: layout.radius.sm, background: withAlpha(COLORS.ink, 0.05), padding: layout.spacing.xs }}
            >
              {/* proof-stat number — kept at 800 per the design system */}
              <div style={{ fontFamily, fontSize: layout.font.sm, fontWeight: 800, color: COLORS.ink }}>{s.value}</div>
              <div style={{ fontFamily, fontSize: layout.font.xs * 0.9, color: withAlpha(COLORS.ink, 0.6), whiteSpace: "nowrap" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
