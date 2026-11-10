import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { displayFont } from "../../theme/fonts";
import { easedInterpolate, STORY_SPRING } from "../../theme/motion";
import { SENJA, SENJA_SHADOWS } from "../../theme/senja";
import { useLayout } from "../../useLayout";
import { useSurface } from "./Surface";

/**
 * Small rotated pill carrying one number or a short claim ("−58%",
 * "Kontaknya milik Anda."). Archivo 700, plum-800 or cream-100. At most one
 * per scene. Springs in, rotating into its final tilt.
 */
export const StickerTag: React.FC<{
  text: string;
  /** Canvas px of the tag's top-left corner. */
  x: number;
  y: number;
  /** Final tilt, −6° to 6°. */
  rotate: number;
  startFrame: number;
  /** Optional frame the tag has faded out by (8-frame fade). */
  endFrame?: number;
  tone?: "plum" | "cream";
}> = ({ text, x, y, rotate, startFrame, endFrame, tone }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const surface = useSurface();
  const resolvedTone = tone ?? (surface === "night" ? "cream" : "plum");
  const pop = spring({ frame: frame - startFrame, fps, config: STORY_SPRING });
  const size = layout.baseUnit * 3.2;
  const clamped = Math.max(-6, Math.min(6, rotate));

  if (frame < startFrame) return null;

  // Tags stay inside the frame: estimate the pill width and pull it back in.
  const estWidth = text.length * size * 0.74 + size * 1.84;
  const margin = layout.width * 0.04;
  const left = Math.max(margin, Math.min(x, layout.width - estWidth - margin));

  return (
    <div
      style={{
        position: "absolute",
        left,
        top: y,
        zIndex: 90,
        ...displayFont(size, 700),
        lineHeight: 1,
        whiteSpace: "nowrap",
        padding: `${size * 0.6}px ${size * 0.92}px`,
        borderRadius: 999,
        backgroundColor: resolvedTone === "plum" ? SENJA.plum800 : SENJA.cream100,
        color: resolvedTone === "plum" ? SENJA.cream100 : SENJA.plum800,
        boxShadow: SENJA_SHADOWS.tag,
        opacity: Math.min(1, pop * 1.4) * (endFrame === undefined ? 1 : easedInterpolate(frame, [endFrame - 8, endFrame], [1, 0])),
        transform: `rotate(${clamped * pop + (1 - pop) * clamped * 2.5}deg) scale(${0.6 + 0.4 * pop})`,
      }}
    >
      {text}
    </div>
  );
};
