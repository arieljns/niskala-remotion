import type { CSSProperties } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, easedInterpolate, SPRING_CONFIG } from "../tokens";
import { fontFamily } from "../fonts";
import { useLayout } from "../useLayout";

/**
 * A headline where one word sits inside an accent highlight box. The line
 * snaps in on the shared bezier easing; the highlight box springs in ~6
 * frames after, per the brief's "animating in slightly after the rest of
 * the line." `highlight` must appear exactly once inside `text`.
 */
export function HighlightText({
  text,
  highlight,
  startFrame = 0,
  fontSize,
  style,
}: {
  text: string;
  highlight: string;
  startFrame?: number;
  fontSize?: number;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const [before, after] = text.split(highlight);

  const textProgress = easedInterpolate(frame, [startFrame, startFrame + 10], [0, 1]);
  const boxProgress = spring({ frame: frame - startFrame - 6, fps, config: SPRING_CONFIG });

  return (
    <div
      style={{
        fontFamily,
        fontWeight: 700,
        fontSize: fontSize ?? layout.font.lg,
        lineHeight: 1.2,
        color: COLORS.ink,
        textAlign: "center",
        opacity: textProgress,
        transform: `translateY(${(1 - textProgress) * layout.spacing.md}px)`,
        ...style,
      }}
    >
      {before}
      <span style={{ position: "relative", display: "inline-block" }}>
        <span
          style={{
            position: "absolute",
            inset: `${-layout.spacing.xs * 0.4}px ${-layout.spacing.xs * 0.5}px`,
            background: COLORS.accent,
            borderRadius: layout.radius.sm,
            transform: `scaleX(${0.4 + boxProgress * 0.6})`,
            transformOrigin: "left center",
          }}
        />
        <span style={{ position: "relative", color: COLORS.cream, padding: `0 ${layout.spacing.xs * 0.5}px` }}>
          {highlight}
        </span>
      </span>
      {after}
    </div>
  );
}
