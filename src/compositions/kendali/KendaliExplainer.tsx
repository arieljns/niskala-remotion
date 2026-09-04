import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, easedInterpolate, getBeatFrames } from "../../tokens";
import { FlatShape, type ShapeKind } from "../../components/FlatShape";
import { KineticText } from "../../components/KineticText";
import { HardCut } from "../../components/HardCut";

/**
 * Section 4c — four separate channel icons, each with its own data line,
 * converging into one unified dashboard. The 4 corner icons never move;
 * only their trailing lines animate, first partway (beat 1, "not yet
 * connected"), then the rest of the way in, staggered per line (beat 2) —
 * that stagger is what reads as "one at a time, quickly" rather than a
 * single simultaneous snap.
 */
const COMPASS_RADIUS = 380;
const SHAPE_SIZE = 90;
const DASHBOARD_BEAT2 = 160;
const DASHBOARD_BEAT3 = 300;

const CHANNELS: { kind: ShapeKind; angleDeg: number }[] = [
  { kind: "circle", angleDeg: -90 }, // top
  { kind: "triangle", angleDeg: 0 }, // right
  { kind: "diamond", angleDeg: 90 }, // bottom
  { kind: "hexagon", angleDeg: 180 }, // left
];

function channelPoint(cx: number, cy: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + COMPASS_RADIUS * Math.cos(rad), y: cy + COMPASS_RADIUS * Math.sin(rad) };
}

export const KendaliExplainer: React.FC = () => {
  const { width, height, fps } = useVideoConfig();
  const [b0, b1, b2, b3] = getBeatFrames(fps);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.cream }}>
      <HardCut from={b0} durationInFrames={b1 - b0} name="beat-1-separate-channels">
        <Beat1 width={width} height={height} />
      </HardCut>
      <HardCut from={b1} durationInFrames={b2 - b1} name="beat-2-converge">
        <Beat2 width={width} height={height} durationInFrames={b2 - b1} />
      </HardCut>
      <HardCut from={b2} durationInFrames={b3 - b2} name="beat-3-unified-grid">
        <Beat3 />
      </HardCut>
    </AbsoluteFill>
  );
};

/** Beat 1 — 4 generic channel icons, unconnected trailing lines toward center. */
function Beat1({ width, height }: { width: number; height: number }) {
  const cx = width / 2;
  const cy = height / 2;

  return (
    <AbsoluteFill>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        {CHANNELS.map((c) => {
          const p = channelPoint(cx, cy, c.angleDeg);
          // Partial trail — stops well short of center ("not yet connected").
          const tx = p.x + (cx - p.x) * 0.45;
          const ty = p.y + (cy - p.y) * 0.45;
          return (
            <line
              key={c.kind}
              x1={p.x}
              y1={p.y}
              x2={tx}
              y2={ty}
              stroke={COLORS.accent}
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {CHANNELS.map((c) => {
        const p = channelPoint(cx, cy, c.angleDeg);
        return (
          <div
            key={c.kind}
            style={{ position: "absolute", left: p.x - SHAPE_SIZE / 2, top: p.y - SHAPE_SIZE / 2 }}
          >
            <FlatShape kind={c.kind} size={SHAPE_SIZE} fill="none" stroke={COLORS.ink} strokeWidth={4} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

/** Beat 2 — camera pushes in, the dashboard appears, each line connects in, staggered. */
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
  const cx = width / 2;
  const cy = height / 2;

  const pushScale = easedInterpolate(frame, [0, durationInFrames], [1, 1.08]);
  const dashboardProgress = easedInterpolate(frame, [0, 8], [0, 1]);

  return (
    <AbsoluteFill style={{ transform: `scale(${pushScale})`, transformOrigin: "50% 50%" }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }} aria-hidden="true">
        {CHANNELS.map((c, i) => {
          const p = channelPoint(cx, cy, c.angleDeg);
          // Each line's own connect-in is staggered by 5 frames per index,
          // so they snap into the dashboard one at a time, not together.
          const delay = i * 5;
          const connect = easedInterpolate(frame, [delay + 6, delay + 16], [0.45, 1]);
          const tx = p.x + (cx - p.x) * connect;
          const ty = p.y + (cy - p.y) * connect;
          return (
            <line
              key={c.kind}
              x1={p.x}
              y1={p.y}
              x2={tx}
              y2={ty}
              stroke={COLORS.accent}
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {CHANNELS.map((c) => {
        const p = channelPoint(cx, cy, c.angleDeg);
        return (
          <div
            key={c.kind}
            style={{ position: "absolute", left: p.x - SHAPE_SIZE / 2, top: p.y - SHAPE_SIZE / 2 }}
          >
            <FlatShape kind={c.kind} size={SHAPE_SIZE} fill="none" stroke={COLORS.ink} strokeWidth={4} />
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: cx - DASHBOARD_BEAT2 / 2,
          top: cy - DASHBOARD_BEAT2 / 2,
          transform: `scale(${dashboardProgress})`,
        }}
      >
        <FlatShape
          kind="roundedRect"
          size={DASHBOARD_BEAT2}
          fill={COLORS.cream}
          stroke={COLORS.ink}
          strokeWidth={4}
          cornerRadius={22}
        />
      </div>
    </AbsoluteFill>
  );
}

/** Beat 3 — the unified dashboard fills with an organized grid, headline lands. */
function Beat3() {
  const frame = useCurrentFrame();
  const gridProgress = easedInterpolate(frame, [2, 16], [0, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: DASHBOARD_BEAT3, height: DASHBOARD_BEAT3 }}>
        <FlatShape
          kind="roundedRect"
          size={DASHBOARD_BEAT3}
          fill={COLORS.cream}
          stroke={COLORS.ink}
          strokeWidth={4}
          cornerRadius={28}
        />
        <GridFill size={DASHBOARD_BEAT3} progress={gridProgress} />
      </div>

      <div style={{ marginTop: 48, maxWidth: "70%", textAlign: "center" }}>
        <KineticText startFrame={6} fontSize={52} style={{ textAlign: "center" }}>
          Satu dashboard untuk semua channel.
        </KineticText>
      </div>
    </AbsoluteFill>
  );
}

/** A 3×3 grid (2 internal dividers each way) drawing on inside the dashboard. */
function GridFill({ size, progress }: { size: number; progress: number }) {
  const inset = 24;
  const inner = size - inset * 2;
  const third1 = inset + inner / 3;
  const third2 = inset + (inner * 2) / 3;
  const lineLen = inner;
  const drawn = lineLen * progress;

  const lines = [
    { x1: third1, y1: inset, x2: third1, y2: size - inset }, // vertical 1
    { x1: third2, y1: inset, x2: third2, y2: size - inset }, // vertical 2
    { x1: inset, y1: third1, x2: size - inset, y2: third1 }, // horizontal 1
    { x1: inset, y1: third2, x2: size - inset, y2: third2 }, // horizontal 2
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden="true"
    >
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={COLORS.ink}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={lineLen}
          strokeDashoffset={lineLen - drawn}
        />
      ))}
    </svg>
  );
}
