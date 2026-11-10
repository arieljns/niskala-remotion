import { AbsoluteFill, useCurrentFrame } from "remotion";

const OFFSETS = [
  [12, -9],
  [-10, 8],
  [6, 5],
] as const;

/** Stage shake, three frames unless given a longer pattern, starting at each frame in `at`. Wraps the camera, never sits inside it. */
export const Shake: React.FC<{
  at: readonly number[];
  offsets?: readonly (readonly [number, number])[];
  children: React.ReactNode;
}> = ({ at, offsets = OFFSETS, children }) => {
  const frame = Math.floor(useCurrentFrame());
  const start = at.find((shakeFrame) => frame >= shakeFrame && frame < shakeFrame + offsets.length);
  const [x, y] = start === undefined ? [0, 0] : offsets[frame - start];

  return <AbsoluteFill style={{ translate: `${x}px ${y}px` }}>{children}</AbsoluteFill>;
};
