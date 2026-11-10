import { interpolate, useCurrentFrame } from "remotion";
import { EASINGS, MOTION } from "./tokens";

const CLAMP_BRAND = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASINGS.brand } as const;

/** Plays the `out` move on finished content starting at `startFrame`, then unmounts it. */
export const ExitText: React.FC<{ startFrame: number; children: React.ReactNode }> = ({ startFrame, children }) => {
  const frame = useCurrentFrame();
  const end = startFrame + MOTION.out;
  if (frame >= end) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        opacity: interpolate(frame, [startFrame, end], [1, 0], CLAMP_BRAND),
        translate: `0px ${interpolate(frame, [startFrame, end], [0, -20], CLAMP_BRAND)}px`,
      }}
    >
      {children}
    </div>
  );
};
