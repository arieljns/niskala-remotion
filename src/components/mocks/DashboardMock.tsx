import { Img } from "remotion";
import { COLORS, withAlpha } from "../../tokens";
import { fontFamily } from "../../fonts";
import { useLayout, type Orientation } from "../../useLayout";
import { ICONS } from "../../assets";

const ORDERS = [
  { id: "#NK-1024", customer: "Rina A.", status: "Diproses" },
  { id: "#NK-1023", customer: "Budi S.", status: "Dikirim" },
  { id: "#NK-1022", customer: "Sarah K.", status: "Selesai" },
];

const STATUS_TINT: Record<string, string> = {
  Diproses: withAlpha(COLORS.ink, 0.12),
  Dikirim: withAlpha(COLORS.accent, 0.18),
  Selesai: withAlpha(COLORS.ink, 0.08),
};

const TRACKER_STEPS = [
  { label: "Diproses", icon: ICONS.clipboard },
  { label: "Dikemas", icon: ICONS.package },
  { label: "Dikirim", icon: ICONS.truck },
  { label: "Sampai", icon: ICONS.mapPin },
];
const ACTIVE_TRACKER_STEP = 2;

/**
 * CODED PLACEHOLDER — order list + delivery tracker built from theme
 * tokens, standing in for public/assets/mockups/dashboard-placeholder.png.
 *
 * The landscape branch (`OrderTable`) matches the brief directly. The
 * portrait branch (`OrderCards`) does NOT — the brief flags a wide data
 * table as unreadable on a 1080px canvas but explicitly asks that this be
 * treated as an open design question, not silently resolved. What's below
 * is a first-pass guess (stacked single-column cards) so the composition
 * still renders; see README.md "Open design questions" before treating it
 * as final.
 */
export function DashboardMock({ orientation }: { orientation: Orientation }) {
  const layout = useLayout();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: layout.spacing.md,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        gap: layout.spacing.lg,
      }}
    >
      {orientation === "landscape" ? (
        <OrderTable />
      ) : (
        // DESIGN DECISION NEEDED: see README.md "Open design questions" —
        // this stacked-card layout is a first-pass guess, not signed off.
        <OrderCards />
      )}
      <Tracker />
    </div>
  );
}

function OrderTable() {
  const layout = useLayout();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: layout.spacing.xs }}>
      {ORDERS.map((o) => (
        <div
          key={o.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${layout.spacing.xs}px ${layout.spacing.sm}px`,
            borderRadius: layout.radius.sm,
            background: withAlpha(COLORS.ink, 0.04),
          }}
        >
          <span style={{ fontFamily, fontSize: layout.font.xs, fontWeight: 700, color: COLORS.ink }}>{o.id}</span>
          <span style={{ fontFamily, fontSize: layout.font.xs, color: withAlpha(COLORS.ink, 0.7) }}>{o.customer}</span>
          <StatusPill status={o.status} />
        </div>
      ))}
    </div>
  );
}

/** First-pass guess for portrait — see file header. */
function OrderCards() {
  const layout = useLayout();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: layout.spacing.xs }}>
      {ORDERS.map((o) => (
        <div
          key={o.id}
          style={{
            padding: layout.spacing.sm,
            borderRadius: layout.radius.sm,
            background: withAlpha(COLORS.ink, 0.04),
            display: "flex",
            flexDirection: "column",
            gap: layout.spacing.xs * 0.6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily, fontSize: layout.font.xs, fontWeight: 700, color: COLORS.ink }}>{o.id}</span>
            <StatusPill status={o.status} />
          </div>
          <span style={{ fontFamily, fontSize: layout.font.xs, color: withAlpha(COLORS.ink, 0.7) }}>{o.customer}</span>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const layout = useLayout();
  return (
    <span
      style={{
        fontFamily,
        fontSize: layout.font.xs,
        fontWeight: 700,
        color: COLORS.ink,
        padding: `${layout.spacing.xs * 0.4}px ${layout.spacing.xs}px`,
        borderRadius: layout.radius.sm,
        background: STATUS_TINT[status],
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function Tracker() {
  const layout = useLayout();
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {TRACKER_STEPS.map((step, i) => (
        <div key={step.label} style={{ display: "flex", alignItems: "center", flex: i < TRACKER_STEPS.length - 1 ? 1 : undefined }}>
          <div
            style={{
              width: layout.icon.sm,
              height: layout.icon.sm,
              flexShrink: 0,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: i === ACTIVE_TRACKER_STEP ? COLORS.accent : withAlpha(COLORS.ink, 0.08),
            }}
          >
            <Img src={step.icon} style={{ width: "55%", height: "55%" }} />
          </div>
          {i < TRACKER_STEPS.length - 1 && (
            <div style={{ flex: 1, height: 2, background: withAlpha(COLORS.ink, 0.14), margin: `0 ${layout.spacing.xs}px` }} />
          )}
        </div>
      ))}
    </div>
  );
}
