import type { CSSProperties } from "react";
import { Img } from "remotion";
import { COLORS, withAlpha } from "../tokens";
import { fontFamily } from "../fonts";
import { useLayout } from "../useLayout";

/**
 * A rounded card pairing one Phosphor icon with a short label — the
 * marketplace chips in Beat1ChaosOpen and the capability chips in
 * Beat4CapabilityFanout both render through this, only the icon/label data
 * differs. `progress` (0-1, usually a spring value) drives the entrance;
 * pass 1 for an already-settled chip.
 */
export function IconChip({
  icon,
  label,
  progress = 1,
  style,
}: {
  icon: string;
  label: string;
  progress?: number;
  style?: CSSProperties;
}) {
  const layout = useLayout();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: layout.spacing.xs,
        padding: `${layout.spacing.sm}px ${layout.spacing.md}px`,
        borderRadius: layout.radius.md,
        background: COLORS.cream,
        border: `${Math.max(2, layout.baseUnit * 0.12)}px solid ${withAlpha(COLORS.ink, 0.14)}`,
        boxShadow: `0 ${layout.baseUnit * 0.6}px ${layout.baseUnit * 1.4}px ${withAlpha(COLORS.ink, 0.08)}`,
        opacity: progress,
        transform: `translateY(${(1 - progress) * layout.spacing.md}px) scale(${0.85 + progress * 0.15})`,
        ...style,
      }}
    >
      <Img src={icon} style={{ width: layout.icon.md, height: layout.icon.md }} />
      <span
        style={{
          fontFamily,
          fontSize: layout.font.xs,
          fontWeight: 700,
          color: COLORS.ink,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}
