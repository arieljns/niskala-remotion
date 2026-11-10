import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, withAlpha } from "../tokens";
import { useLayout } from "../useLayout";

interface Square {
  size: number;
  x: number;
  y: number;
  speed: number;
  alpha: number;
}

const SQUARES: Square[] = [
  { size: 38, x: 0.12, y: 0.16, speed: 0.6, alpha: 0.05 },
  { size: 52, x: 0.8, y: 0.22, speed: 0.4, alpha: 0.06 },
  { size: 30, x: 0.2, y: 0.82, speed: 0.5, alpha: 0.07 },
  { size: 46, x: 0.86, y: 0.78, speed: 0.35, alpha: 0.045 },
];

/**
 * The low-opacity, slow-drifting ink squares behind every scene. Sits below
 * everything else in ChunkOne.tsx, drawn once and shared by all six beats
 * rather than re-mounted per <Sequence> so the drift never resets on a beat
 * cut. Ink-only per the brief — accent is reserved for hero elements, never
 * decorative fill.
 */
export function BackgroundAmbient() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }} from={32}>
      {SQUARES.map((s, i) => {
        const size = layout.baseUnit * s.size;
        const floatY = Math.sin(t * s.speed + i * 1.7) * layout.baseUnit * 3;
        const floatX = Math.cos(t * s.speed * 0.8 + i * 1.7) * layout.baseUnit * 2;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: size,
              height: size,
              left: layout.width * s.x - size / 2 + floatX,
              top: layout.height * s.y - size / 2 + floatY,
              borderRadius: layout.radius.lg,
              background: withAlpha(COLORS.ink, s.alpha),
              filter: `blur(${layout.baseUnit * 2.4}px)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}
