import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, easedInterpolate } from "./tokens";
import { fontFamily } from "./fonts";
import { FlatShape, type ShapeKind } from "./components/FlatShape";
import { KineticText } from "./components/KineticText";
import { HardCut } from "./components/HardCut";
import { DashboardIcon } from "./components/DashboardIcon";
import { ReportCardIcon } from "./components/ReportCardIcon";

/**
 * Stage 2 only — a single composition that lays out every shared primitive
 * so each can be checked with a handful of `remotion still` renders before
 * any of it is wired into the real package compositions. Not part of the
 * final site output; safe to delete once stage 2 is confirmed.
 */
const SHAPE_KINDS: ShapeKind[] = [
  "circle",
  "ring",
  "square",
  "roundedRect",
  "triangle",
  "hexagon",
  "diamond",
];

export const PreviewHarness: React.FC = () => {
  const frame = useCurrentFrame();
  const lineProgress = easedInterpolate(frame, [10, 40], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream, padding: 64 }}>
      {/* Row 1 — every FlatShape kind. */}
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        {SHAPE_KINDS.map((kind) => (
          <div key={kind} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <FlatShape kind={kind} size={96} />
            <span style={{ fontFamily, fontSize: 18, color: COLORS.ink }}>{kind}</span>
          </div>
        ))}
      </div>

      {/* Row 2 — KineticText snap-in. */}
      <div style={{ marginTop: 56 }}>
        <KineticText startFrame={0}>Kinetic Text</KineticText>
      </div>

      {/* Row 3 — DashboardIcon + ReportCardIcon (line draws on 10→40). */}
      <div style={{ marginTop: 56, display: "flex", gap: 48, alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 16,
            border: `2px solid ${COLORS.ink}`,
          }}
        >
          <DashboardIcon size={56} />
        </div>
        <ReportCardIcon lineProgress={lineProgress} />
      </div>

      {/* Row 4 — HardCut sanity check: beat A (frames 45–67), beat B (frames 67–90). */}
      <div style={{ marginTop: 56, position: "relative", height: 80 }}>
        <HardCut from={45} durationInFrames={22} name="preview-beat-a">
          <div style={{ fontFamily, fontSize: 40, fontWeight: 700, color: COLORS.accent }}>
            Beat A
          </div>
        </HardCut>
        <HardCut from={67} durationInFrames={23} name="preview-beat-b">
          <div style={{ fontFamily, fontSize: 40, fontWeight: 700, color: COLORS.accent }}>
            Beat B
          </div>
        </HardCut>
      </div>
    </AbsoluteFill>
  );
};
