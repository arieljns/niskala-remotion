import { interpolateColors, useCurrentFrame } from "remotion";
import { EASINGS, MOTION } from "./tokens";

export type MorphState = {
  width: number;
  height: number;
  radius: number;
  background: string;
  /** 0 = flat, 1 = the card shadow. */
  shadow: number;
  content?: React.ReactNode;
};

/** The box becomes `state` over start..end. The first step's frames are ignored: it is the starting state. */
export type MorphStep = { start: number; end: number; state: MorphState };

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/**
 * One element whose size, radius, fill and shadow interpolate from step to
 * step, centred on (x, y). Content crossfades over 5 frames at the middle of
 * each step and is clipped by the box, so it never scales or squashes.
 */
export const MorphBox: React.FC<{ x: number; y: number; steps: readonly MorphStep[]; from?: number }> = ({
  x,
  y,
  steps,
  from = 0,
}) => {
  const frame = useCurrentFrame();
  if (frame < from) {
    return null;
  }

  let index = 0;
  for (let i = 1; i < steps.length; i++) {
    if (frame >= steps[i].start) {
      index = i;
    }
  }
  const step = steps[index];
  const previous = steps[Math.max(0, index - 1)];
  const linear = index === 0 ? 1 : Math.min(1, (frame - step.start) / (step.end - step.start));
  const t = EASINGS.brand(linear);
  const middle = (step.start + step.end) / 2;
  const fade =
    index === 0
      ? 1
      : Math.min(1, Math.max(0, (frame - (middle - MOTION.morphFadeHalf)) / (MOTION.morphFadeHalf * 2)));

  const width = lerp(previous.state.width, step.state.width, t);
  const height = lerp(previous.state.height, step.state.height, t);
  const shadow = lerp(previous.state.shadow, step.state.shadow, t);

  const contentLayer = (content: React.ReactNode, opacity: number) =>
    opacity > 0 && content ? (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity,
        }}
      >
        {content}
      </div>
    ) : null;

  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
        overflow: "hidden",
        borderRadius: lerp(previous.state.radius, step.state.radius, t),
        backgroundColor: interpolateColors(t, [0, 1], [previous.state.background, step.state.background]),
        boxShadow: `0 30px 60px -20px rgba(42,20,32,${0.25 * shadow})`,
      }}
    >
      {index > 0 ? contentLayer(previous.state.content, 1 - fade) : null}
      {contentLayer(step.state.content, fade)}
    </div>
  );
};
