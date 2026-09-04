import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, easedInterpolate } from "../tokens";
import { fontFamily } from "../fonts";

/**
 * Headline/label entrance used everywhere on-screen text appears across all
 * three compositions. Snaps into place on the locked easing curve over 9
 * frames (mid of the spec'd 8–10 frame range), then holds static — no
 * continuous drift, no opacity crossfade. `startFrame` is relative to
 * whatever <Sequence>/<HardCut> this sits inside (i.e. pass a small local
 * frame, not the absolute video frame).
 */
export function KineticText({
  children,
  startFrame = 0,
  mode = "translateY",
  fontSize = 64,
  fontWeight = 800,
  color = COLORS.ink,
  style,
}: {
  children: string;
  /** Frame (relative to the enclosing Sequence) the snap-in begins. */
  startFrame?: number;
  mode?: "translateY" | "scale";
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  style?: CSSProperties;
}) {
  const frame = useCurrentFrame();
  const ENTRANCE_FRAMES = 9;

  const progress = easedInterpolate(
    frame,
    [startFrame, startFrame + ENTRANCE_FRAMES],
    [0, 1],
  );

  const transform =
    mode === "translateY"
      ? `translateY(${(1 - progress) * 28}px)`
      : `scale(${0.85 + progress * 0.15})`;

  return (
    <div
      style={{
        fontFamily,
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        transform,
        // Hard snap: no opacity fade. Below `startFrame` the text is fully
        // transformed out of place (translated down / scaled small) rather
        // than invisible, matching "snap into place", not "fade in".
        ...style,
      }}
    >
      {children}
    </div>
  );
}
