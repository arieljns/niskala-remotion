import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, easedInterpolate, getBeatFrames } from "../../tokens";
import { FlatShape } from "../../components/FlatShape";
import { KineticText } from "../../components/KineticText";
import { HardCut } from "../../components/HardCut";
import { DashboardIcon } from "../../components/DashboardIcon";

/**
 * Section 4a — a product breaking free from a crowded, generic marketplace
 * container into its own owned storefront with a dashboard. Registered at
 * two aspect ratios in Root.tsx (both share a min(width,height) of 1080, so
 * shape sizes below are fixed pixel values; only the origin/destination
 * layout direction adapts, row for widescreen, column for portrait).
 */
const CONTAINER = { width: 420, height: 320 };
const DEST = { width: 220, height: 170 };
const SQUARE_SIZE = 64;
const GRID_GAP = 14;

export const FondasiExplainer: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const [b0, b1, b2, b3] = getBeatFrames(fps);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      <HardCut from={b0} durationInFrames={b1 - b0} name="beat-1-crowded-container">
        <Beat1 />
      </HardCut>
      <HardCut from={b1} durationInFrames={b2 - b1} name="beat-2-breaks-free">
        <Beat2 width={width} height={height} durationInFrames={b2 - b1} />
      </HardCut>
      <HardCut from={b2} durationInFrames={b3 - b2} name="beat-3-dashboard-payoff">
        <Beat3 width={width} height={height} />
      </HardCut>
    </AbsoluteFill>
  );
};

/** Beat 1 — several identical squares crowded inside one generic container. */
function Beat1() {
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <SquareGrid omitIndex={null} />
    </AbsoluteFill>
  );
}

/** Beat 2 — one square breaks out, accent trail, toward its own bordered space. */
function Beat2({
  width,
  height,
  durationInFrames,
}: {
  width: number;
  height: number;
  durationInFrames: number;
}) {
  const frame = useCurrentFrame();
  const isPortrait = height > width;

  const originCenter = isPortrait
    ? { x: width / 2, y: height * 0.36 }
    : { x: width * 0.3, y: height / 2 };
  const destCenter = isPortrait
    ? { x: width / 2, y: height * 0.62 }
    : { x: width * 0.74, y: height / 2 };

  const progress = easedInterpolate(frame, [4, durationInFrames - 6], [0, 1]);
  const heroX = originCenter.x + (destCenter.x - originCenter.x) * progress;
  const heroY = originCenter.y + (destCenter.y - originCenter.y) * progress;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: originCenter.x - CONTAINER.width / 2,
          top: originCenter.y - CONTAINER.height / 2,
        }}
      >
        <SquareGrid omitIndex={4} />
      </div>

      <div
        style={{
          position: "absolute",
          left: destCenter.x - DEST.width / 2,
          top: destCenter.y - DEST.height / 2,
        }}
      >
        <FlatShape
          kind="roundedRect"
          width={DEST.width}
          height={DEST.height}
          fill="none"
          stroke={COLORS.accent}
          strokeWidth={4}
          cornerRadius={20}
        />
      </div>

      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden="true"
      >
        <line
          x1={originCenter.x}
          y1={originCenter.y}
          x2={heroX}
          y2={heroY}
          stroke={COLORS.accent}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.55}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: heroX - SQUARE_SIZE / 2,
          top: heroY - SQUARE_SIZE / 2,
        }}
      >
        <FlatShape kind="square" size={SQUARE_SIZE} fill={COLORS.ink} />
      </div>
    </AbsoluteFill>
  );
}

/** Beat 3 — the separated square gets its dashboard, then the headline lands. */
function Beat3({ width, height }: { width: number; height: number }) {
  const frame = useCurrentFrame();
  const isPortrait = height > width;

  const iconProgress = easedInterpolate(frame, [0, 9], [0, 1]);
  const iconTransform = `translateY(${(1 - iconProgress) * 24}px) scale(${0.7 + iconProgress * 0.3})`;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: isPortrait ? "column" : "row",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div style={{ position: "relative", width: DEST.width, height: DEST.height }}>
          <FlatShape
            kind="roundedRect"
            width={DEST.width}
            height={DEST.height}
            fill="none"
            stroke={COLORS.accent}
            strokeWidth={4}
            cornerRadius={20}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FlatShape kind="square" size={SQUARE_SIZE} fill={COLORS.ink} />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 20,
            border: `3px solid ${COLORS.ink}`,
            transform: iconTransform,
          }}
        >
          <DashboardIcon size={52} />
        </div>
      </div>

      <div
        style={{
          marginTop: 48,
          maxWidth: isPortrait ? width * 0.82 : width * 0.5,
          textAlign: "center",
        }}
      >
        <KineticText
          startFrame={4}
          fontSize={isPortrait ? 56 : 52}
          style={{ textAlign: "center" }}
        >
          Toko Anda, bukan sewaan platform.
        </KineticText>
      </div>
    </AbsoluteFill>
  );
}

/** The 3×3 crowd of identical squares inside the generic container outline.
 * `omitIndex` leaves one grid cell empty (the square that's mid-escape in
 * beat 2, rendered separately on top so it can move). */
function SquareGrid({ omitIndex }: { omitIndex: number | null }) {
  return (
    <div style={{ position: "relative", width: CONTAINER.width, height: CONTAINER.height }}>
      <FlatShape
        kind="roundedRect"
        width={CONTAINER.width}
        height={CONTAINER.height}
        fill="none"
        stroke={COLORS.ink}
        strokeWidth={4}
        cornerRadius={24}
      />
      <div
        style={{
          position: "absolute",
          inset: 30,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: GRID_GAP,
          alignItems: "center",
          justifyItems: "center",
        }}
      >
        {Array.from({ length: 9 }).map((_, i) =>
          i === omitIndex ? (
            <div key={i} />
          ) : (
            <FlatShape key={i} kind="square" size={SQUARE_SIZE} fill={COLORS.ink} />
          ),
        )}
      </div>
    </div>
  );
}
