import { useId } from "react";
import { Img, useCurrentFrame } from "remotion";
import { storyFlat } from "../../assets";
import { easedInterpolate, withAlpha } from "../../theme/motion";
import { SENJA, SENJA_SHADOWS } from "../../theme/senja";
import { useLayout, type Layout } from "../../useLayout";
import { Camera } from "../components/Camera";
import { Caption } from "../components/Caption";
import { Highlight } from "../components/Highlight";
import { PHONE_ASPECT, PHONE_SCREEN, PhoneFrame } from "../components/PhoneFrame";
import { QR_01, SETIA5_BANNER_02 } from "../hotspots";
import { Surface } from "../senja/Surface";
import { settledTilt } from "../senja/tilt";
import { Vault } from "../senja/Vault";
import type { SceneComponent } from "./index";

/** Act 1 sits on Paper. */
const SURFACE = "paper";

/** The print PNG is 1179x2556 at 3x — same logical size as a phone screen. */
const PRINT = { width: PHONE_SCREEN.width, height: PHONE_SCREEN.height } as const;
/** The thank-you card itself inside 01 (headline, QR, SETIA5, note). */
const CARD_BOX = { x: 22, y: 262, width: 352, height: 425 } as const;
const QR_CENTER = { x: QR_01.x + QR_01.width / 2, y: QR_01.y + QR_01.height / 2 };

/**
 * The shared visual slot for Act 1, right of the caption in 16:9 and below it
 * in 9:16. 1a's photo card and 1b's phone are both centred on it, so the scan
 * brackets hold one canvas position across the match-cut.
 */
function getStage(layout: Layout) {
  const { width: W, height: H } = layout;
  if (layout.isPortrait) {
    const w = W * 0.7;
    return { cx: W * 0.5, cy: H * 0.63, cardW: w, cardH: w * 1.25, phoneH: H * 0.6, vault: { centerX: W * 0.5, top: H * 0.52, width: W * 0.88 } };
  }
  const w = W * 0.29;
  return { cx: W * 0.7, cy: H * 0.5, cardW: w, cardH: w * 1.25, phoneH: H * 0.76, vault: { centerX: W * 0.7, top: H * 0.3, width: W * 0.38 } };
}

/** The print PNG is 3x: past 3 canvas px per point the QR is being upscaled and goes soft. */
const PRINT_PIXEL_DENSITY = 3;
/** Stay a little under native so the QR modules always render crisp. */
const MAX_PRINT_SCALE = PRINT_PIXEL_DENSITY * 0.8;

/** 1a camera inside the card: whole thank-you card → QR up to ~60% of the card width, never past native resolution. */
function getPrintShot(cardW: number) {
  const startScale = cardW / (CARD_BOX.width + 24);
  const endScale = Math.min((cardW * 0.6) / QR_01.width, MAX_PRINT_SCALE);
  return { startScale, endScale, bracketSize: (QR_01.width + 18) * endScale };
}

/** Viewfinder corners in the bar gradient — the thread that carries the match-cut. */
const ScanBrackets: React.FC<{ cx: number; cy: number; size: number; opacity: number; scale?: number }> = ({ cx, cy, size, opacity, scale = 1 }) => {
  const id = `scan${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const arm = size * 0.2;
  const s = size;
  const corners = [
    `M0 ${arm} V0 H${arm}`,
    `M${s - arm} 0 H${s} V${arm}`,
    `M0 ${s - arm} V${s} H${arm}`,
    `M${s - arm} ${s} H${s} V${s - arm}`,
  ];

  return (
    <svg
      width={s}
      height={s}
      style={{ position: "absolute", left: cx - s / 2, top: cy - s / 2, overflow: "visible", opacity, transform: `scale(${scale})`, zIndex: 40 }}
    >
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={s} y2={0}>
          <stop offset="0%" stopColor={SENJA.plum500} />
          <stop offset="55%" stopColor={SENJA.red500} />
          <stop offset="100%" stopColor={SENJA.orange400} />
        </linearGradient>
      </defs>
      {corners.map((d) => (
        <path key={d} d={d} fill="none" stroke={`url(#${id})`} strokeWidth={Math.max(5, s * 0.016)} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  );
};

/** 1a — the thank-you print as a photo card on the vault; push-in inside the card onto the QR, then a scan sweep. */
const Scene1a: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const stage = getStage(layout);
  const shot = getPrintShot(stage.cardW);

  const push = easedInterpolate(frame, [8, 112], [0, 1]);
  const scale = shot.startScale + (shot.endScale - shot.startScale) * push;
  const cardCenter = { x: CARD_BOX.x + CARD_BOX.width / 2, y: CARD_BOX.y + CARD_BOX.height / 2 };
  const focusX = cardCenter.x + (QR_CENTER.x - cardCenter.x) * push;
  const focusY = cardCenter.y + (QR_CENTER.y - cardCenter.y) * push;
  // The card sits tilted and settles flat just as the scanner locks on.
  const tilt = settledTilt(frame, 74, -4, layout, 30);
  const enter = easedInterpolate(frame, [0, 18], [0, 1]);

  const brackets = easedInterpolate(frame, [74, 86], [0, 1]);
  const sweep = easedInterpolate(frame, [88, 116], [0, 1]);
  const sweepOpacity = easedInterpolate(frame, [88, 92, 112, 118], [0, 1, 1, 0]);
  const size = shot.bracketSize;
  const lineY = stage.cy - size / 2 + size * (0.08 + 0.84 * sweep);

  return (
    <Surface kind={SURFACE} glowFrom={22}>
      <Vault {...stage.vault} />
      <div
        style={{
          position: "absolute",
          left: stage.cx - stage.cardW / 2,
          top: stage.cy - stage.cardH / 2,
          width: stage.cardW,
          height: stage.cardH,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: SENJA_SHADOWS.device,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 24}px) rotate(${tilt}deg)`,
        }}
      >
        <Camera
          contentWidth={PRINT.width}
          contentHeight={PRINT.height}
          focusX={focusX}
          focusY={focusY}
          scale={scale}
          viewportWidth={stage.cardW}
          viewportHeight={stage.cardH}
        >
          <Img src={storyFlat("01-packaging-insert")} style={{ width: PRINT.width, height: PRINT.height }} />
        </Camera>
      </div>

      <ScanBrackets cx={stage.cx} cy={stage.cy} size={size} opacity={brackets} scale={1.08 - 0.08 * brackets} />
      {/* Scan line with a warm glow trailing above it. */}
      <div
        style={{
          position: "absolute",
          left: stage.cx - size * 0.44,
          width: size * 0.88,
          top: lineY - size * 0.2,
          height: size * 0.2,
          opacity: sweepOpacity,
          zIndex: 41,
          background: `linear-gradient(180deg, ${withAlpha(SENJA.orange400, 0)} 0%, ${withAlpha(SENJA.orange400, 0.35)} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: stage.cx - size * 0.44,
          width: size * 0.88,
          top: lineY - 2,
          height: 4,
          borderRadius: 2,
          opacity: sweepOpacity,
          zIndex: 41,
          backgroundColor: SENJA.red500,
        }}
      />

      <Caption text={scene.caption} startFrame={6} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

/** 1b — match-cut: the brackets hold, the phone rises into the card's slot with 02, the SETIA5 banner gets the ring. */
const Scene1b: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const stage = getStage(layout);
  const { bracketSize } = getPrintShot(stage.cardW);

  const phoneW = stage.phoneH / PHONE_ASPECT;
  const rise = easedInterpolate(frame, [0, 34], [1, 0]);
  const push = easedInterpolate(frame, [34, scene.durationInFrames], [1, 1.03]);
  const tilt = settledTilt(frame, 42, -5, layout, 26);
  const bracketsOut = easedInterpolate(frame, [0, 14], [1, 0]);

  return (
    <Surface kind={SURFACE} glowFrom={36}>
      <Vault {...stage.vault} />
      <div
        style={{
          position: "absolute",
          left: stage.cx - phoneW / 2,
          top: stage.cy - stage.phoneH / 2,
          transform: `translateY(${rise * layout.height * 0.75}px) scale(${push})`,
          transformOrigin: "50% 20%",
        }}
      >
        <PhoneFrame src={storyFlat("02-first-visit-home")} width={phoneW} tilt={tilt}>
          <Highlight rect={SETIA5_BANNER_02} startFrame={42} />
        </PhoneFrame>
      </div>

      <ScanBrackets cx={stage.cx} cy={stage.cy} size={bracketSize} opacity={bracketsOut} scale={1 + 0.15 * (1 - bracketsOut)} />
      <Caption text={scene.caption} startFrame={12} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

export const ACT1_SCENES = { "1a": Scene1a, "1b": Scene1b };
