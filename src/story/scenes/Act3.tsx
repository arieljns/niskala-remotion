import { Check } from "@phosphor-icons/react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { storyFlat } from "../../assets";
import { CLIENT } from "../../theme/client";
import { easedInterpolate, STORY_SPRING, withAlpha } from "../../theme/motion";
import { useLayout } from "../../useLayout";
import { Caption } from "../components/Caption";
import { StickerTag } from "../senja/StickerTag";
import { Surface } from "../senja/Surface";
import { settledTilt } from "../senja/tilt";
import { Vault } from "../senja/Vault";
import { Highlight } from "../components/Highlight";
import { LAPTOP_SCREEN, LaptopFrame } from "../components/LaptopFrame";
import { PngSlice } from "../components/PngSlice";
import { ORDER_COLUMN_09, ORDERS_TABLE_07, REVENUE_CHART_10, TIMELINE_08, WA_UPDATES_08 } from "../hotspots";
import { getVaultWindow as getWindow, LaptopShotView, VaultWindow, WHOLE_IN_WINDOW as WHOLE } from "../components/VaultLaptop";
import { byOrientation } from "../laptopShot";
import type { SceneComponent } from "./index";

/** Admin card white, and the dashed empty-state circle colour from 08's "Tiba di alamat" step. */
const CARD_WHITE = CLIENT.white;
const EMPTY_STEP = "#D9D1C4";

/** Act 3 sits on Paper. */
const SURFACE = "paper";

/** 3a — two new orders slide into the top of the table, each with a soft sienna flash. */
const Scene3a: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const src = storyFlat("07-admin-orders");
  const T = ORDERS_TABLE_07;
  const rowH = T.rowHeight;
  const win = getWindow(layout);

  // TA-10490 (PNG row 2) lands first, then TA-10491 (PNG row 1) pushes it down.
  const landings = [46, 76];
  const arriveA = easedInterpolate(frame, [landings[0] - 18, landings[0]], [0, 1]);
  const arriveB = easedInterpolate(frame, [landings[1] - 18, landings[1]], [0, 1]);
  const flash = (land: number) =>
    interpolate(frame, [land - 4, land + 4, land + 34], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const rows = [
    { pngRow: 1, y: -rowH + arriveA * rowH + arriveB * rowH, opacity: arriveA, flash: flash(landings[0]) },
    { pngRow: 0, y: -rowH + arriveB * rowH, opacity: arriveB, flash: flash(landings[1]) },
  ];

  return (
    <Surface kind={SURFACE} glowFrom={20}>
      <VaultWindow rect={win}>
      <LaptopShotView
        src={src}
        from={byOrientation(layout, WHOLE, { cx: 560, cy: 400, span: 680, anchorY: 0.4 })}
        to={byOrientation(layout, { cx: 640, cy: 430, span: 1040, anchorY: 0.45 }, { cx: 540, cy: 400, span: 600, anchorY: 0.4 })}
        frames={[0, scene.durationInFrames]}
        viewportWidth={win.width}
        viewportHeight={win.height}
      >
        {/* Table body window: the older rows start in the top slots and step down as each new order lands. */}
        <div
          style={{
            position: "absolute",
            left: T.x,
            top: T.firstRowY,
            width: T.width,
            height: rowH * T.rows,
            overflow: "hidden",
            backgroundColor: CARD_WHITE,
          }}
        >
          <PngSlice
            src={src}
            imageWidth={LAPTOP_SCREEN.width}
            imageHeight={LAPTOP_SCREEN.height}
            x={T.x}
            y={T.firstRowY + rowH * 2}
            width={T.width}
            height={rowH * (T.rows - 2)}
            style={{ left: 0, top: (arriveA + arriveB) * rowH }}
          />
          {rows.map((row) => (
            <div key={row.pngRow} style={{ position: "absolute", left: 0, top: row.y, width: T.width, height: rowH, opacity: row.opacity }}>
              <PngSlice
                src={src}
                imageWidth={LAPTOP_SCREEN.width}
                imageHeight={LAPTOP_SCREEN.height}
                x={T.x}
                y={T.firstRowY + rowH * row.pngRow}
                width={T.width}
                height={rowH}
                style={{ left: 0, top: 0 }}
              />
              <div style={{ position: "absolute", inset: 0, backgroundColor: withAlpha(CLIENT.accent, 0.16 * row.flash) }} />
            </div>
          ))}
        </div>
      </LaptopShotView>
      </VaultWindow>
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

/** One timeline step in 08: an empty dashed circle until `tick`, then the green check springs in. */
const TimelineCheck: React.FC<{ y: number; tick: number }> = ({ y, tick }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { x, checkRadius: r } = TIMELINE_08;
  const pop = spring({ frame: frame - tick, fps, config: STORY_SPRING });
  const done = frame >= tick;

  return (
    <div
      style={{
        position: "absolute",
        left: x - r - 2,
        top: y - r - 2,
        width: (r + 2) * 2,
        height: (r + 2) * 2,
        borderRadius: "50%",
        backgroundColor: CARD_WHITE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {done ? (
        <div
          style={{
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            backgroundColor: CLIENT.green,
            color: CLIENT.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `scale(${0.4 + 0.6 * pop})`,
          }}
        >
          <Check size={14} weight="bold" />
        </div>
      ) : (
        <div style={{ width: r * 2 - 3, height: r * 2 - 3, borderRadius: "50%", border: `1.5px dashed ${EMPTY_STEP}` }} />
      )}
    </div>
  );
};

/** 3b — the tracking timeline ticks top to bottom, then the "3 pesan" WhatsApp box pulses. */
const Scene3b: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const { x, checkYs, checkRadius: r, dotY } = TIMELINE_08;
  const ticks = [14, 24, 34, 44];
  const dotTick = 54;
  const box = WA_UPDATES_08;
  const win = getWindow(layout);

  // Connector segments (each check down to the next, the last one down to the
  // current dot) are hidden behind white and uncover top-down between ticks.
  const segments = [
    ...checkYs.slice(0, -1).map((y, i) => ({ top: y + r, bottom: checkYs[i + 1] - r, from: ticks[i], to: ticks[i + 1] })),
    { top: checkYs[3] + r, bottom: dotY - 17, from: ticks[3], to: dotTick },
  ];
  const dotPop = spring({ frame: frame - dotTick, fps, config: STORY_SPRING });

  return (
    <Surface kind={SURFACE} glowFrom={20}>
      <VaultWindow rect={win}>
      <LaptopShotView
        src={storyFlat("08-admin-order-detail")}
        from={byOrientation(layout, { cx: 800, cy: 400, span: 1200, anchorY: 0.45 }, { cx: 960, cy: 400, span: 640, anchorY: 0.42 })}
        to={byOrientation(layout, { cx: 875, cy: 420, span: 650, anchorY: 0.45 }, { cx: 962, cy: 420, span: 480, anchorY: 0.4 })}
        frames={[0, scene.durationInFrames]}
        viewportWidth={win.width}
        viewportHeight={win.height}
      >
        {segments.map((seg, i) => {
          const grow = easedInterpolate(frame, [seg.from, seg.to], [0, 1]);
          const height = seg.bottom - seg.top;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - 3,
                top: seg.top + height * grow,
                width: 6,
                height: height * (1 - grow) + 0.5,
                backgroundColor: CARD_WHITE,
              }}
            />
          );
        })}
        {checkYs.map((y, i) => (
          <TimelineCheck key={y} y={y} tick={ticks[i]} />
        ))}
        {/* Current step: hidden until the line reaches it, then it springs in from the PNG's own dot. */}
        <div
          style={{
            position: "absolute",
            left: x - 18,
            top: dotY - 18,
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: CARD_WHITE,
            opacity: 1 - dotPop,
            transform: `scale(${1 - 0.5 * dotPop})`,
          }}
        />
        {[68, 86].map((start) => {
          const t = interpolate(frame, [start, start + 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const grow = 14 * t;
          return (
            <div
              key={start}
              style={{
                position: "absolute",
                left: box.x - grow,
                top: box.y - grow,
                width: box.width + grow * 2,
                height: box.height + grow * 2,
                borderRadius: box.radius + grow,
                border: `2px solid ${CLIENT.green}`,
                opacity: frame >= start ? 0.7 * (1 - t) : 0,
              }}
            />
          );
        })}
      </LaptopShotView>
      </VaultWindow>
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

/**
 * 3c — the store's own customer list, on the whole laptop (no crop, no
 * second device). The point is what a saved contact leads to: the ring lands
 * on the ORDER column (how often each saved buyer came back), then the
 * repeat-buyer tag springs in. No channel is named.
 * Right of the caption in 16:9, under it in 9:16.
 */
const Scene3c: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const { width: W, height: H, isPortrait: portrait } = layout;

  const RING_AT = 60;
  const rise = easedInterpolate(frame, [0, 24], [1, 0]);
  const tilt = settledTilt(frame, RING_AT, -4, layout, 40);
  const laptop = portrait ? { width: W * 0.92, cx: W * 0.5, top: H * 0.46 } : { width: W * 0.5, cx: W * 0.69, top: H * 0.3 };
  const vault = portrait ? { centerX: W * 0.5, top: H * 0.42, width: W * 0.88 } : { centerX: W * 0.69, top: H * 0.24, width: W * 0.42 };

  return (
    <Surface kind={SURFACE} glowFrom={30}>
      <Vault {...vault} />
      <div
        style={{
          position: "absolute",
          left: laptop.cx - laptop.width / 2,
          top: laptop.top,
          opacity: 1 - rise,
          transform: `translateY(${rise * 24}px)`,
        }}
      >
        <LaptopFrame src={storyFlat("09-admin-customers")} width={laptop.width} tilt={tilt} contoh>
          <Highlight rect={ORDER_COLUMN_09} startFrame={RING_AT} />
        </LaptopFrame>
      </div>
      <StickerTag
        text="41% pembeli kembali"
        x={portrait ? W * 0.08 : laptop.cx - laptop.width * 0.42}
        y={portrait ? vault.top - H * 0.05 : vault.top - H * 0.09}
        rotate={-4}
        startFrame={RING_AT + 8}
      />
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

/** Smooth-enough polyline through the traced daily points. */
function linePath(points: readonly (readonly [number, number])[]) {
  return points.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px} ${py}`).join(" ");
}

/** Line height at a given x along the traced points (for the pen dot). */
function yAt(points: readonly (readonly [number, number])[], x: number) {
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return points[points.length - 1][1];
}

/** 3d — the daily revenue chart from 10, rebuilt: the line draws left to right and the area fills behind it. */
const Scene3d: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const { plot, gridYs, points } = REVENUE_CHART_10;
  const first = points[0];
  const last = points[points.length - 1];

  const draw = easedInterpolate(frame, [14, 74], [0, 1]);
  const revealX = first[0] + (last[0] - first[0]) * draw;
  const endPop = spring({ frame: frame - 74, fps, config: STORY_SPRING });
  const area = `${linePath(points)} L${last[0]} ${plot.baseline} L${first[0]} ${plot.baseline} Z`;
  const win = getWindow(layout);

  return (
    <Surface kind={SURFACE} glowFrom={20}>
      <VaultWindow rect={win}>
      <LaptopShotView
        src={storyFlat("10-admin-revenue")}
        from={byOrientation(layout, WHOLE, { cx: 560, cy: 460, span: 700, anchorY: 0.45 })}
        to={byOrientation(layout, { cx: 590, cy: 520, span: 860, anchorY: 0.45 }, { cx: 560, cy: 460, span: 640, anchorY: 0.45 })}
        frames={[0, scene.durationInFrames]}
        viewportWidth={win.width}
        viewportHeight={win.height}
      >
        <svg
          width={LAPTOP_SCREEN.width}
          height={LAPTOP_SCREEN.height}
          viewBox={`0 0 ${LAPTOP_SCREEN.width} ${LAPTOP_SCREEN.height}`}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <defs>
            <linearGradient id="story-revenue-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CLIENT.accent} stopOpacity={0.2} />
              <stop offset="100%" stopColor={CLIENT.accent} stopOpacity={0.02} />
            </linearGradient>
            <clipPath id="story-revenue-reveal">
              <rect x={plot.left} y={plot.top} width={Math.max(0, revealX - plot.left)} height={plot.baseline - plot.top} />
            </clipPath>
          </defs>
          {/* Cover the PNG's own line and fill (keeping the axis labels and baseline), then redraw the grid. */}
          <rect x={plot.left} y={plot.top} width={plot.right - plot.left} height={plot.baseline - plot.top - 0.5} fill={CARD_WHITE} />
          {gridYs.map((gy) => (
            <line key={gy} x1={first[0] + 1} x2={last[0]} y1={gy} y2={gy} stroke="#EFE8DC" strokeWidth={1} />
          ))}
          <g clipPath="url(#story-revenue-reveal)">
            <path d={area} fill="url(#story-revenue-area)" />
            <path d={linePath(points)} fill="none" stroke={CLIENT.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          </g>
          {draw > 0 && draw < 1 ? <circle cx={revealX} cy={yAt(points, revealX)} r={3.5} fill={CLIENT.accent} /> : null}
          {frame >= 74 ? (
            <>
              <circle cx={last[0]} cy={last[1]} r={9 * endPop} fill={withAlpha(CLIENT.accent, 0.18)} />
              <circle cx={last[0]} cy={last[1]} r={4.5 * endPop} fill={CLIENT.accent} stroke={CLIENT.white} strokeWidth={1.5} />
            </>
          ) : null}
        </svg>
      </LaptopShotView>
      </VaultWindow>
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

export const ACT3_SCENES = { "3a": Scene3a, "3b": Scene3b, "3c": Scene3c, "3d": Scene3d };
