import { AbsoluteFill, useCurrentFrame } from "remotion";
import { withAlpha } from "../theme/motion";
import { COLORS, REEL } from "./tokens";

const DRIFT_PERIOD_FRAMES = 270;
const DRIFT_AMOUNT = 0.04;

/** Size and resting centre as fractions of the canvas; phase offsets the drift. */
const BLOBS = [
  { size: 0.8, x: 0.22, y: 0.2, phase: 0 },
  { size: 0.7, x: 0.82, y: 0.52, phase: 2.1 },
  { size: 0.6, x: 0.3, y: 0.86, phase: 4.2 },
] as const;

/** Eased falloff: a straight fade to transparent shows a visible edge on so pale a surface. */
const BLOB_GRADIENT = `radial-gradient(closest-side, ${withAlpha(COLORS.mistBlob, 1)} 0%, ${withAlpha(COLORS.mistBlob, 0.72)} 30%, ${withAlpha(COLORS.mistBlob, 0.36)} 55%, ${withAlpha(COLORS.mistBlob, 0.12)} 78%, ${withAlpha(COLORS.mistBlob, 0.03)} 92%, ${withAlpha(COLORS.mistBlob, 0)} 100%)`;

/** Outside the camera: it drifts but never zooms. */
export const MistBackground: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.mist, overflow: "hidden" }}>
      {BLOBS.map((blob) => {
        const angle = (frame / DRIFT_PERIOD_FRAMES) * Math.PI * 2 + blob.phase;
        const width = REEL.width * blob.size;
        const height = REEL.height * blob.size;
        const centerX = REEL.width * (blob.x + Math.sin(angle) * DRIFT_AMOUNT);
        const centerY = REEL.height * (blob.y + Math.cos(angle) * DRIFT_AMOUNT);

        return (
          <div
            key={blob.phase}
            style={{
              position: "absolute",
              left: centerX - width / 2,
              top: centerY - height / 2,
              width,
              height,
              background: BLOB_GRADIENT,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const NightBackground: React.FC = () => <AbsoluteFill style={{ backgroundColor: COLORS.night }} />;
