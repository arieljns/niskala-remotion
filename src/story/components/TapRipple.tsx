import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CLIENT } from "../../theme/client";
import { STORY_SPRING, withAlpha } from "../../theme/motion";

export type TapRippleProps = {
  /** Tap point in the device screen's logical coordinates. */
  x: number;
  y: number;
  /** Scene-relative frame the finger lands. */
  startFrame: number;
  /** Fill colour of the touch; ink by default so it shows on cream and on sienna buttons. */
  color?: string;
};

const TOUCH = 40;
const RING = 96;

/**
 * A tap: a soft touch dot springs in, then a ring expands out of it and
 * fades. Render as a child of PhoneFrame so it moves with the screen.
 */
export const TapRipple: React.FC<TapRippleProps> = ({ x, y, startFrame, color = CLIENT.ink }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const press = spring({ frame: local, fps, config: STORY_SPRING, durationInFrames: 10 });
  const touchOpacity = interpolate(local, [0, 4, 14, 24], [0, 0.28, 0.28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ring = spring({ frame: local - 4, fps, config: STORY_SPRING, durationInFrames: 22 });
  const ringOpacity = interpolate(local, [4, 10, 28], [0, 0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - RING / 2,
          top: y - RING / 2,
          width: RING,
          height: RING,
          borderRadius: "50%",
          border: `2px solid ${withAlpha(color, 1)}`,
          opacity: ringOpacity,
          transform: `scale(${0.4 + 0.6 * ring})`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - TOUCH / 2,
          top: y - TOUCH / 2,
          width: TOUCH,
          height: TOUCH,
          borderRadius: "50%",
          backgroundColor: color,
          opacity: touchOpacity,
          transform: `scale(${0.6 + 0.4 * press})`,
          pointerEvents: "none",
        }}
      />
    </>
  );
};
