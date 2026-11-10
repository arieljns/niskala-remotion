import type { CSSProperties, ReactNode } from "react";
import { Img } from "remotion";
import { COLORS, withAlpha } from "../tokens";
import { useLayout } from "../useLayout";
import { ICONS } from "../assets";

/**
 * A mockup browser window that can wrap any content (storefront in Beat3,
 * dashboard in Beat5). `widthPct` is a fraction of canvas width, never a
 * fixed px value — 70% of a 1920 canvas and 70% of a 1080 canvas are very
 * different absolute sizes, and this way the same prop value reads
 * correctly in both compositions.
 */
export function BrowserFrame({
  children,
  widthPct,
  aspectRatio = 16 / 10,
  showBrowserIcon = false,
  style,
}: {
  children: ReactNode;
  widthPct: number;
  aspectRatio?: number;
  showBrowserIcon?: boolean;
  style?: CSSProperties;
}) {
  const layout = useLayout();
  const frameWidth = layout.width * widthPct;
  const contentHeight = frameWidth / aspectRatio;
  const barHeight = layout.baseUnit * 3.2;
  const dotSize = layout.baseUnit * 0.9;

  return (
    <div
      style={{
        width: frameWidth,
        borderRadius: layout.radius.lg,
        overflow: "hidden",
        background: COLORS.cream,
        border: `${Math.max(2, layout.baseUnit * 0.12)}px solid ${withAlpha(COLORS.ink, 0.16)}`,
        boxShadow: `0 ${layout.baseUnit * 2}px ${layout.baseUnit * 5}px ${withAlpha(COLORS.ink, 0.16)}`,
        ...style,
      }}
    >
      <div
        style={{
          height: barHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${layout.spacing.sm}px`,
          borderBottom: `1px solid ${withAlpha(COLORS.ink, 0.1)}`,
        }}
      >
        <div style={{ display: "flex", gap: layout.spacing.xs * 0.6 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: "50%",
                background: withAlpha(COLORS.ink, 0.25),
              }}
            />
          ))}
        </div>
        {showBrowserIcon && <Img
          src={ICONS.browser}
          style={{
            width: dotSize * 1.6,
            height: dotSize * 1.6,
            opacity: 0.5,
          }}
          from={-2}
        />}
      </div>
      <div style={{ width: frameWidth, height: contentHeight, position: "relative" }}>{children}</div>
    </div>
  );
}
