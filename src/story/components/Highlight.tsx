import { useId } from "react";
import { useCurrentFrame } from "remotion";
import { easedInterpolate, withAlpha } from "../../theme/motion";
import { SENJA } from "../../theme/senja";

export type HotspotRect = { x: number; y: number; width: number; height: number; radius: number };

export type HighlightProps = {
  /** The element to call out, in the device screen's logical coordinates (see hotspots.ts). */
  rect: HotspotRect;
  /** Scene-relative frame the highlight starts. */
  startFrame?: number;
  /** Optional frame it eases back out; omit to hold until the scene ends. */
  endFrame?: number;
  /** Gap between the element's edge and the ring, in screen units. */
  padding?: number;
};

const DIM_FRAMES = 12;
const DRAW_FRAMES = 10;
const RING = 3;

/**
 * Senja highlight: the rest of the screen dims to 55% and a 3px ring with the
 * bar gradient draws on around the target over 10 frames. This is Niskala
 * staging drawn over the screen (the one allowed Senja element inside a
 * device). Render it as a child of PhoneFrame / LaptopFrame.
 */
export const Highlight: React.FC<HighlightProps> = ({ rect, startFrame = 0, endFrame, padding = 4 }) => {
  const frame = useCurrentFrame();
  const id = `hl${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const out = endFrame === undefined ? 1 : easedInterpolate(frame, [endFrame, endFrame + DIM_FRAMES], [1, 0]);
  const dim = easedInterpolate(frame, [startFrame, startFrame + DIM_FRAMES], [0, 1]) * out;
  const draw = easedInterpolate(frame, [startFrame, startFrame + DRAW_FRAMES], [0, 1]);

  const w = rect.width + padding * 2;
  const h = rect.height + padding * 2;
  const r = rect.radius + padding;

  return (
    <div
      style={{
        position: "absolute",
        left: rect.x - padding,
        top: rect.y - padding,
        width: w,
        height: h,
        borderRadius: r,
        // Spread shadow = the dim over everything outside the ring (screen to 55%).
        boxShadow: `0 0 0 9999px ${withAlpha(SENJA.night, 0.45 * dim)}`,
        pointerEvents: "none",
      }}
    >
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: out }}>
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={w} y2={0}>
            <stop offset="0%" stopColor={SENJA.plum500} />
            <stop offset="55%" stopColor={SENJA.red500} />
            <stop offset="100%" stopColor={SENJA.orange400} />
          </linearGradient>
        </defs>
        <rect
          x={-RING / 2}
          y={-RING / 2}
          width={w + RING}
          height={h + RING}
          rx={r + RING / 2}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={RING}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
      </svg>
    </div>
  );
};
