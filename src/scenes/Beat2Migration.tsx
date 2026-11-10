import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { easedInterpolate, SPRING_CONFIG } from "../tokens";
import { arcPoint, getBagAnchor, useLayout } from "../useLayout";
import { LogoMark } from "../components/LogoMark";
import { ParticleDot } from "../components/ParticleDot";

const PARTICLES_PER_SOURCE = 3;

/**
 * Beat 2 (90-180) — the customer particles that were swarming Beat 1's
 * single shopping bag arc toward center, staggered per source and per
 * particle, passing behind the LogoMark "gate" that scales in at canvas
 * center. Sources are a tight cluster around `getBagAnchor` — the exact
 * spot Beat1ChaosOpen put the bag — so the migration reads as continuous
 * in both orientations.
 */
export function Beat2Migration({ durationInFrames }: { durationInFrames: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();

  const bag = getBagAnchor(layout);
  const s = layout.baseUnit * 7;
  const sources = [
    { x: bag.x - s, y: bag.y - s * 0.5 },
    { x: bag.x + s * 0.3, y: bag.y + s * 0.4 },
    { x: bag.x + s, y: bag.y - s * 0.3 },
  ];

  const logoEntrance = spring({ frame: frame - 10, fps, config: SPRING_CONFIG });
  const logoSize = layout.icon.lg * (layout.isPortrait ? 2.2 : 1.6);

  return (
    <AbsoluteFill>
      {sources.flatMap((source, si) =>
        Array.from({ length: PARTICLES_PER_SOURCE }).map((_, pi) => {
          const startDelay = si * 8 + pi * 5;
          const travel = easedInterpolate(frame, [startDelay, durationInFrames - 14], [0, 1]);
          const bow = (si - 1) * layout.baseUnit * 6 + (pi - 1) * layout.baseUnit * 3;
          const pos = arcPoint(source, layout.center, travel, bow);
          const fadeNearGate = interpolate(travel, [0.88, 1], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return <ParticleDot key={`${si}-${pi}`} x={pos.x} y={pos.y} delay={startDelay} opacity={fadeNearGate} />;
        }),
      )}

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }} from={-1}>
        <div style={{ transform: `scale(${logoEntrance})` }}>
          <LogoMark size={logoSize} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
