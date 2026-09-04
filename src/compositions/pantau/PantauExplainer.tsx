import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, easedInterpolate, getBeatFrames } from "../../tokens";
import { FlatShape } from "../../components/FlatShape";
import { KineticText } from "../../components/KineticText";
import { HardCut } from "../../components/HardCut";
import { ReportCardIcon } from "../../components/ReportCardIcon";

/**
 * Section 4b — a storefront emitting a steady pulse that feeds into an
 * updating monthly report card. The pulse repeating twice within beat 1 is
 * what signals "ongoing monitoring", not a one-time event.
 */
const STOREFRONT = { roofWidth: 150, roofHeight: 60, baseWidth: 130, baseHeight: 90 };
const CARD = { width: 260, height: 170 };
const PULSE_CYCLE_FRAMES = 27; // two full pulses across a 54-frame (1.8s @30fps) beat.

export const PantauExplainer: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const [b0, b1, b2, b3] = getBeatFrames(fps);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      <HardCut from={b0} durationInFrames={b1 - b0} name="beat-1-pulse">
        <Beat1 />
      </HardCut>
      <HardCut from={b1} durationInFrames={b2 - b1} name="beat-2-report-card-enters">
        <Beat2 width={width} height={height} />
      </HardCut>
      <HardCut from={b2} durationInFrames={b3 - b2} name="beat-3-fresh-update">
        <Beat3 />
      </HardCut>
    </AbsoluteFill>
  );
};

/** Beat 1 — storefront center frame, an accent ring pulses outward twice. */
function Beat1() {
  const frame = useCurrentFrame();
  const t = frame % PULSE_CYCLE_FRAMES;

  // The locked easing curve is heavily front-loaded (fast start, slow
  // finish) — fading opacity out over the same short window the scale uses
  // made the ring all but gone by ~30% of the cycle. Stretching opacity
  // across the full cycle keeps the ring visible as it expands instead of
  // reading as a single flash.
  const ringScale = easedInterpolate(t, [0, PULSE_CYCLE_FRAMES], [0.5, 1.9]);
  const ringOpacity = easedInterpolate(t, [0, PULSE_CYCLE_FRAMES], [0.75, 0]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 220, height: 220 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${ringScale})`,
            opacity: ringOpacity,
          }}
        >
          <FlatShape kind="ring" size={220} stroke={COLORS.accent} strokeWidth={5} />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <StorefrontIcon />
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** Beat 2 — the pulse feeds into a report card entering from the side, line draws on. */
function Beat2({ width, height }: { width: number; height: number }) {
  const frame = useCurrentFrame();
  const isPortrait = height > width;

  const storefrontCenter = isPortrait
    ? { x: width / 2, y: height * 0.32 }
    : { x: width * 0.28, y: height / 2 };
  const cardCenter = isPortrait
    ? { x: width / 2, y: height * 0.6 }
    : { x: width * 0.68, y: height / 2 };

  const entrance = easedInterpolate(frame, [0, 12], [0, 1]);
  const cardOffset = isPortrait
    ? { x: 0, y: (1 - entrance) * 60 }
    : { x: (1 - entrance) * 80, y: 0 };
  const lineProgress = easedInterpolate(frame, [10, 40], [0, 1]);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: storefrontCenter.x - 90,
          top: storefrontCenter.y - 90,
        }}
      >
        <StorefrontIcon size={180} />
      </div>

      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden="true"
      >
        <line
          x1={storefrontCenter.x}
          y1={storefrontCenter.y}
          x2={cardCenter.x + cardOffset.x}
          y2={cardCenter.y + cardOffset.y}
          stroke={COLORS.accent}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.5}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: cardCenter.x - CARD.width / 2 + cardOffset.x,
          top: cardCenter.y - CARD.height / 2 + cardOffset.y,
          opacity: entrance,
        }}
      >
        <ReportCardIcon width={CARD.width} height={CARD.height} lineProgress={lineProgress} />
      </div>
    </AbsoluteFill>
  );
}

/** Beat 3 — the card flashes (hard scale snap, not a fade), headline lands. */
function Beat3() {
  const frame = useCurrentFrame();
  const flashScale = easedInterpolate(frame, [0, 4, 9], [1, 1.08, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${flashScale})` }}>
        <ReportCardIcon width={CARD.width} height={CARD.height} lineProgress={1} />
      </div>

      <div style={{ marginTop: 48, maxWidth: "70%", textAlign: "center" }}>
        <KineticText startFrame={6} fontSize={52} style={{ textAlign: "center" }}>
          Toko yang dipantau, bukan ditinggal.
        </KineticText>
      </div>
    </AbsoluteFill>
  );
}

function StorefrontIcon({ size = 220 }: { size?: number }) {
  const scale = size / 220;
  return (
    <div
      style={{
        position: "relative",
        width: STOREFRONT.baseWidth * scale,
        height: (STOREFRONT.roofHeight + STOREFRONT.baseHeight) * scale,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: (STOREFRONT.baseWidth * scale - STOREFRONT.roofWidth * scale) / 2,
        }}
      >
        <FlatShape
          kind="triangle"
          width={STOREFRONT.roofWidth * scale}
          height={STOREFRONT.roofHeight * scale}
          fill={COLORS.ink}
        />
      </div>
      <div style={{ position: "absolute", top: STOREFRONT.roofHeight * scale - 2 * scale, left: 0 }}>
        <FlatShape
          kind="square"
          width={STOREFRONT.baseWidth * scale}
          height={STOREFRONT.baseHeight * scale}
          fill={COLORS.ink}
        />
      </div>
    </div>
  );
}
