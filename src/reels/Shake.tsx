import { AbsoluteFill, useCurrentFrame } from "remotion";

const OFFSETS = [
  [12, -9],
  [-10, 8],
  [6, 5],
] as const;

/** Three-frame stage shake starting at each frame in `at`. Wraps the camera, never sits inside it. */
export const Shake: React.FC<{ at: readonly number[]; children: React.ReactNode }> = ({ at, children }) => {
  const frame = Math.floor(useCurrentFrame());
  const start = at.find((shakeFrame) => frame >= shakeFrame && frame < shakeFrame + OFFSETS.length);
  const [x, y] = start === undefined ? [0, 0] : OFFSETS[frame - start];

  return <AbsoluteFill style={{ translate: `${x}px ${y}px` }}>{children}</AbsoluteFill>;
};
