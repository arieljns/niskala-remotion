import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, EASINGS, SHADOWS } from "./tokens";
import type { SentenceLayout } from "./wordLayout";

export const PUNCH_FRAMES = 14;
export const SQUASH_FRAMES = 20;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CLAMP_BRAND = { ...CLAMP, easing: EASINGS.brand } as const;

/** Local frame to scale. Exported so the safe-zone check tests the real overshoot. */
export function punchScale(local: number): number {
  if (local <= 9) {
    // easePop overshoots on its own; the 1.15 peak is the brief's ceiling.
    return Math.min(1.15, interpolate(local, [0, 9], [0.6, 1.15], { ...CLAMP, easing: EASINGS.pop }));
  }
  return interpolate(local, [9, PUNCH_FRAMES], [1.15, 1], CLAMP_BRAND);
}

export function squashScale(local: number): { x: number; y: number } {
  const frames = [0, 8, 14, SQUASH_FRAMES];
  return {
    x: interpolate(local, frames, [1.5, 0.9, 1.04, 1], CLAMP_BRAND),
    y: interpolate(local, frames, [0.7, 1.1, 0.97, 1], CLAMP_BRAND),
  };
}

/** The big data word. Lebay comes from size, glow and motion, never from cropping. */
export const LebayWord: React.FC<{
  layout: SentenceLayout;
  preset: "punch" | "squash";
  startFrame: number;
}> = ({ layout, preset, startFrame }) => {
  const frame = useCurrentFrame();
  if (frame < startFrame) {
    return null;
  }
  const local = frame - startFrame;
  const scale = preset === "punch" ? { x: punchScale(local), y: punchScale(local) } : squashScale(local);
  const blur =
    preset === "punch"
      ? interpolate(local, [0, PUNCH_FRAMES], [30, 0], CLAMP_BRAND)
      : interpolate(local, [0, 8], [20, 0], CLAMP_BRAND);
  const { box, style, words } = layout;

  return (
    <div
      style={{
        position: "absolute",
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        scale: `${scale.x} ${scale.y}`,
        transformOrigin: "center",
        opacity: interpolate(local, [0, 3], [0, 1], CLAMP),
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
      }}
    >
      {words.map((word, index) => (
        <div
          key={`${index}-${word.text}`}
          style={{
            position: "absolute",
            left: word.x - box.x,
            top: word.y - box.y,
            whiteSpace: "pre",
            fontFamily: style.fontFamily,
            fontStretch: style.fontStretch,
            fontWeight: style.fontWeight,
            fontSize: style.fontSize,
            letterSpacing: style.letterSpacing,
            lineHeight: `${word.height}px`,
            color: COLORS.accent,
            textShadow: preset === "punch" ? SHADOWS.punchGlow : undefined,
          }}
        >
          {word.text}
        </div>
      ))}
    </div>
  );
};
