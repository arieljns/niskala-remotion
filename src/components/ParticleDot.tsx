import type { CSSProperties } from "react";
import { Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, SPRING_CONFIG, withAlpha } from "../tokens";
import { useLayout } from "../useLayout";

/**
 * A small circular customer marker. `x`/`y` are absolute positions within
 * whichever positioned ancestor renders it (canvas-absolute in
 * Beat2Migration's arcs, chip-local in Beat1ChaosOpen's orbits) — the caller
 * owns the path math (see arcPoint/orbit logic in useLayout.ts and the
 * scenes), this component just springs in and sits there. Pass `iconSrc`
 * for the "customer" glyph variant (Beat1's orbiting dots); omit it for a
 * flat dot (Beat2's faster-moving migration trail).
 */
export function ParticleDot({
  x,
  y,
  size,
  color = COLORS.ink,
  delay = 0,
  opacity = 1,
  iconSrc,
  style,
}: {
  x: number;
  y: number;
  size?: number;
  color?: string;
  delay?: number;
  opacity?: number;
  iconSrc?: string;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const d = size ?? (iconSrc ? layout.baseUnit * 3.2 : layout.baseUnit * 1.3);
  const entrance = spring({ frame: frame - delay, fps, config: SPRING_CONFIG });

  return (
    <div
      style={{
        position: "absolute",
        left: x - d / 2,
        top: y - d / 2,
        width: d,
        height: d,
        borderRadius: "50%",
        background: iconSrc ? COLORS.cream : color,
        border: iconSrc ? `${Math.max(1, layout.baseUnit * 0.1)}px solid ${withAlpha(COLORS.ink, 0.14)}` : undefined,
        display: iconSrc ? "flex" : undefined,
        alignItems: iconSrc ? "center" : undefined,
        justifyContent: iconSrc ? "center" : undefined,
        opacity: opacity * entrance,
        transform: `scale(${entrance})`,
        ...style,
      }}
    >
      {iconSrc && <Img src={iconSrc} style={{ width: "60%", height: "60%" }} />}
    </div>
  );
}
