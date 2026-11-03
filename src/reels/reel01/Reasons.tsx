import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { AssetSlot } from "../AssetSlot";
import { MistBackground } from "../Backgrounds";
import { Camera, fitCamera, sentenceCamera, World, type CameraKeyframe, type CameraState } from "../camera";
import type { BoxCheck, SentenceCheck } from "../debug";
import { ExitText } from "../ExitText";
import { LebayWord, squashScale, SQUASH_FRAMES } from "../LebayWord";
import {
  chartPath,
  FLAT_LINE_CONTACT,
  FLAT_LINE_FRAMES,
  FlatLine,
  lineProgress,
  lineTip,
  pointsBounds,
  priceSeries,
  RisingLine,
} from "../lines";
import { Shake } from "../Shake";
import { CAMERA_ZOOM, COLORS, EASINGS, MOTION, SHADOWS, TYPE } from "../tokens";
import { WordBuild, wordTiming } from "../WordBuild";
import { layoutSentence, measureWidth, scaleBox, unionBox } from "../wordLayout";
import { SCENES } from "./timeline";

/**
 * S3-S5 share one world so the camera pans between them with no cut. S4 sits
 * above S3; S5 sits up and to the right of S4, along the rising line. The gaps
 * keep each area out of the others' framing. Frames are local to this Sequence.
 */
const SCENE_START = SCENES.reasons.from;
const S3_AT = { x: 502, y: 3100 };
const S4_AT = { x: 502, y: 1200 };
const S5_AT = { x: 1800, y: 900 };

/* S3 */
const TEXT_A_START = -2;
const CAMERA_TO_STACK = 6;
const TEXT_A_OUT = 45;
const TEXT_B_START = TEXT_A_OUT + MOTION.out;
const PILL_MOVE = 16;
const PILL_STAGGER = 8;
const PILL_FIRST = 12;
const PILLS_LANDED = PILL_FIRST + PILL_STAGGER * 2 + PILL_MOVE;
const SINK_FRAMES = 30;
const PILL_HEIGHT = 120;
const PILL_GAP = 40;
/** easePop over a 900 px flight overshoots ~100 px; a little is the bounce, more leaves the safe zone. */
const PILL_MAX_OVERSHOOT = 24;
const PILL_PADDING = 56;
/** Set right of the text, so following "tenggelam" doesn't push the stack off the left edge. */
const STACK_OFFSET_X = 185;

const PROMOS = [
  { id: "TODO_PROMO_FLASH_SALE", label: "Flash sale", offsetX: 0, landing: -4, sinkTurn: -12 },
  { id: "TODO_PROMO_TANGGAL_KEMBAR", label: "Diskon tanggal kembar", offsetX: 0, landing: 3, sinkTurn: 9 },
  { id: "TODO_PROMO_GRATIS_ONGKIR", label: "Gratis ongkir", offsetX: 8, landing: -2, sinkTurn: -7 },
] as const;

/* S3 to S4 */
const PAN_UP = 21;

/* S4 */
const S4_WORDS_START = 121;
const LINE_START_AFTER_HOLD = MOTION.stillBeforeHit;
const LINE_FRAMES = 30;
const CHART_CURVE = 3.2;
const CHART_FROM = { x: S4_AT.x - 468, y: S4_AT.y + 400 };
const CHART_TO = { x: S4_AT.x + 430, y: S4_AT.y - 420 };
// TODO_CHART_FIGURES: real values with a source go here. The chart carries no numbers until then.

/* S4 to S5 */
const CHART_HOLD_FRAMES = 21;
const PAN_RIGHT = 18;

/* S5 */
const S5_TEXT_LEFT = S5_AT.x - 300;
export function useReasons() {
  return useMemo(() => {
    /* ---------- S3 layout ---------- */
    const textLeft = S3_AT.x - 405;
    const textTop = S3_AT.y - 360;
    const textA = layoutSentence({
      lines: ["~~Gak ikut~~ __promo?__"],
      style: TYPE.sentence,
      topLeft: { x: textLeft, y: textTop },
    });
    const textB = layoutSentence({
      lines: ["~~Toko kamu~~ **tenggelam**."],
      style: TYPE.sentence,
      topLeft: { x: textLeft, y: textTop },
    });
    const pills = PROMOS.map((promo, index) => ({
      ...promo,
      x: textLeft + STACK_OFFSET_X + promo.offsetX,
      y: textTop + textA.box.height + 60 + index * (PILL_HEIGHT + PILL_GAP),
      width: measureWidth(promo.label, TYPE.uiLabel) + PILL_PADDING * 2,
      height: PILL_HEIGHT,
      start: PILL_FIRST + index * PILL_STAGGER,
    }));
    const stack = unionBox(textA.box, ...pills);
    const stackCamera = fitCamera(stack, CAMERA_ZOOM.stack);

    /* ---------- S3 camera ---------- */
    const aCamera = sentenceCamera({
      layout: textA,
      startFrame: TEXT_A_START,
      pullStart: CAMERA_TO_STACK,
      target: stackCamera,
    });
    const bCamera = sentenceCamera({
      layout: textB,
      startFrame: TEXT_B_START,
      enter: { from: stackCamera, frame: TEXT_A_OUT, duration: 14 },
      // The stack is still on screen under this sentence and may only leave by sinking.
      followAmount: 0.2,
    });
    const bHoldCamera = fitCamera(textB.box);
    const sinkStart = wordTiming(textB, TEXT_B_START, MOTION.wordGap).settled;
    const panUpStart = bCamera.holdStart + MOTION.holdMin;

    /* ---------- S4 layout ---------- */
    const s4Text = layoutSentence({
      lines: ["__Biaya marketing__", "**naik** ~~terus.~~"],
      style: TYPE.sentence,
      topLeft: { x: CHART_FROM.x, y: S4_AT.y - 590 },
    });
    const linePoints = priceSeries({
      seed: "reel01-marketing-cost",
      from: CHART_FROM,
      to: CHART_TO,
      count: 72,
      noise: 34,
      curve: CHART_CURVE,
    });
    const lineBounds = pointsBounds(linePoints, 30);
    const s4Fit = fitCamera(unionBox(s4Text.box, lineBounds));

    /* ---------- S4 camera ---------- */
    const s4Camera = sentenceCamera({
      layout: s4Text,
      startFrame: S4_WORDS_START,
      enter: { from: bHoldCamera, frame: panUpStart, duration: PAN_UP },
    });
    const lineStart = s4Camera.holdStart + LINE_START_AFTER_HOLD;
    const chaseEnd = lineStart + LINE_FRAMES - 8;
    const sentenceHold: CameraState = fitCamera(s4Text.box);
    const chase: CameraKeyframe[] = [];
    for (let frame = lineStart; frame <= chaseEnd; frame++) {
      // Chases the chart's smooth trend: following every small move of the tip would shake the camera.
      const tipX = lineTip(chartPath(linePoints), lineProgress(frame, lineStart, LINE_FRAMES)).x;
      const across = (tipX - CHART_FROM.x) / (CHART_TO.x - CHART_FROM.x);
      const tip = { x: tipX, y: CHART_FROM.y + (CHART_TO.y - CHART_FROM.y) * Math.pow(across, CHART_CURVE) };
      const mix = EASINGS.camera(Math.min(1, (frame - lineStart) / 8));
      chase.push({
        frame,
        x: sentenceHold.x + (tip.x - sentenceHold.x) * mix,
        y: sentenceHold.y + (tip.y - sentenceHold.y) * mix,
        s: sentenceHold.s + (CAMERA_ZOOM.lineChase - sentenceHold.s) * mix,
        ease: "linear",
      });
    }
    const s4FitReady = chaseEnd + MOTION.pullBack;
    const lineEnd = lineStart + LINE_FRAMES;
    const panRightStart = lineEnd + CHART_HOLD_FRAMES + 7;
    const panRightEnd = panRightStart + PAN_RIGHT;

    /* ---------- S5 layout ---------- */
    const omzet = layoutSentence({
      lines: ["__Omzet?__"],
      style: TYPE.sentence,
      topLeft: { x: S5_TEXT_LEFT, y: S5_AT.y - 300 },
    });
    const segitu = layoutSentence({
      lines: ["Segitu-", "segitu"],
      style: TYPE.squash,
      topLeft: { x: S5_TEXT_LEFT, y: omzet.box.y + omzet.box.height + 36 },
    });
    const secondLine = segitu.words[1];
    // Shares the second line's baseline: Archivo sits 0.334 em below its line box centre.
    const baselineOf = (top: number, size: number, lineHeight: number) => top + lineHeight / 2 + size * 0.334;
    const ajaTop =
      baselineOf(secondLine.y, TYPE.squash.fontSize, secondLine.height) -
      (TYPE.sentence.fontSize * TYPE.sentence.lineHeight) / 2 -
      TYPE.sentence.fontSize * 0.334;
    const aja = layoutSentence({
      lines: ["~~aja.~~"],
      style: TYPE.sentence,
      topLeft: { x: secondLine.x + secondLine.width + 24, y: ajaTop },
    });
    const flatLineY = segitu.box.y + segitu.box.height + 90;
    const flatWidth = 760;
    const flatPoints = priceSeries({
      seed: "reel01-revenue",
      from: { x: S5_TEXT_LEFT, y: flatLineY },
      to: { x: S5_TEXT_LEFT + flatWidth, y: flatLineY },
      count: 56,
      noise: 26,
      curve: 1,
    });
    const flatD = chartPath(flatPoints);
    const flatBounds = pointsBounds(flatPoints, 12);
    const segituPeak = scaleBox(segitu.box, 1.5, 1.1);
    const s5Fit = fitCamera(unionBox(omzet.box, segituPeak, aja.box, flatBounds));

    /* ---------- S5 timing ---------- */
    const omzetStart = panRightEnd - 3;
    const omzetCamera = fitCamera(omzet.box, CAMERA_ZOOM.follow);
    const omzetSettled = omzetStart + MOTION.wordIn;
    const flatStart = omzetSettled;
    const s5FitReady = omzetSettled + MOTION.pullBack;
    const flatSettled = flatStart + FLAT_LINE_FRAMES;
    const squashStart = flatSettled + MOTION.stillBeforeHit;
    const ajaStart = squashStart + SQUASH_FRAMES;
    const ajaSettled = ajaStart + MOTION.wordIn;
    const end = ajaSettled + MOTION.holdMin;

    const keyframes: CameraKeyframe[] = [
      ...aCamera.keyframes,
      ...bCamera.keyframes,
      ...s4Camera.keyframes,
      ...chase,
      { frame: s4FitReady, ...s4Fit },
      { frame: panRightStart, ...s4Fit, ease: "linear" },
      { frame: panRightEnd, ...omzetCamera },
      { frame: omzetSettled, ...omzetCamera, ease: "linear" },
      { frame: s5FitReady, ...s5Fit },
    ];

    /* ---------- dev checks ---------- */
    const sentenceChecks: SentenceCheck[] = [
      {
        id: "S3 text A",
        sceneStart: SCENE_START,
        layout: textA,
        keyframes,
        starts: aCamera.starts,
        holdStart: aCamera.holdStart,
        holdEnd: TEXT_A_OUT,
      },
      {
        id: "S3 text B",
        sceneStart: SCENE_START,
        layout: textB,
        keyframes,
        starts: bCamera.starts,
        holdStart: bCamera.holdStart,
        holdEnd: panUpStart,
      },
      {
        id: "S4 text",
        sceneStart: SCENE_START,
        layout: s4Text,
        keyframes,
        starts: s4Camera.starts,
        holdStart: s4Camera.holdStart,
        holdEnd: lineStart,
        minHold: MOTION.stillBeforeHit,
      },
      {
        id: "S5 Omzet?",
        sceneStart: SCENE_START,
        layout: omzet,
        keyframes,
        starts: [omzetStart],
        holdStart: s5FitReady,
        holdEnd: end,
      },
      {
        id: "S5 aja.",
        sceneStart: SCENE_START,
        layout: aja,
        keyframes,
        starts: [ajaStart],
        holdStart: ajaSettled,
        holdEnd: end,
      },
    ];
    const boxChecks: BoxCheck[] = [
      {
        id: "S3 promo stack",
        sceneStart: SCENE_START,
        keyframes,
        from: PILLS_LANDED,
        to: TEXT_A_OUT,
        boxAt: () => unionBox(...pills),
      },
      {
        id: "S3 promo stack stays on screen until it sinks",
        sceneStart: SCENE_START,
        keyframes,
        from: PILLS_LANDED,
        to: sinkStart,
        // 2% covers the corners of the tilted pills.
        boxAt: () => scaleBox(unionBox(...pills), 1.02),
        area: "frame",
      },
      {
        id: "S4 line + sentence",
        sceneStart: SCENE_START,
        keyframes,
        from: s4FitReady,
        to: panRightStart,
        boxAt: () => unionBox(s4Text.box, lineBounds),
      },
      {
        id: "S5 Segitu-segitu including overshoot",
        sceneStart: SCENE_START,
        keyframes,
        from: squashStart,
        to: end,
        boxAt: (frame) => {
          const scale = squashScale(frame - squashStart);
          return scaleBox(segitu.box, scale.x, scale.y);
        },
      },
      {
        id: "S5 flat line",
        sceneStart: SCENE_START,
        keyframes,
        from: flatSettled,
        to: end,
        boxAt: () => flatBounds,
      },
    ];

    return {
      textA,
      textB,
      pills,
      sinkStart,
      s4Text,
      linePoints,
      lineBounds,
      lineStart,
      lineEnd,
      omzet,
      omzetStart,
      segitu,
      aja,
      flatD,
      flatBounds,
      flatStart,
      squashStart,
      ajaStart,
      end,
      keyframes,
      sentenceChecks,
      boxChecks,
    };
  }, []);
}

const Pill: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      whiteSpace: "pre",
      borderRadius: PILL_HEIGHT / 2,
      background: COLORS.card,
      boxShadow: SHADOWS.card,
      color: COLORS.ink,
      fontFamily: TYPE.uiLabel.fontFamily,
      fontWeight: TYPE.uiLabel.fontWeight,
      fontSize: TYPE.uiLabel.fontSize,
    }}
  >
    {label}
  </div>
);

const PromoStack: React.FC<{ pills: ReturnType<typeof useReasons>["pills"]; sinkStart: number }> = ({
  pills,
  sinkStart,
}) => {
  const frame = useCurrentFrame();
  const sinkEnd = sinkStart + SINK_FRAMES;
  if (frame >= sinkEnd) {
    return null;
  }

  return (
    <>
      {pills.map((pill) => {
        if (frame < pill.start) {
          return null;
        }
        const landed = pill.start + PILL_MOVE;
        const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
        const blur = interpolate(frame, [pill.start, landed], [24, 0], { ...clamp, easing: EASINGS.pop });
        const sink = { ...clamp, easing: Easing.in(Easing.cubic) };
        return (
          <div
            key={pill.id}
            style={{
              position: "absolute",
              left: pill.x,
              top: pill.y,
              width: pill.width,
              height: pill.height,
              translate: `${Math.max(-PILL_MAX_OVERSHOOT, interpolate(frame, [pill.start, landed], [900, 0], { ...clamp, easing: EASINGS.pop }))}px ${interpolate(frame, [sinkStart, sinkEnd], [0, 1500], sink)}px`,
              rotate: `${
                interpolate(frame, [pill.start, landed], [pill.landing + 14, pill.landing], {
                  ...clamp,
                  easing: EASINGS.pop,
                }) + interpolate(frame, [sinkStart, sinkEnd], [0, pill.sinkTurn], sink)
              }deg`,
              filter: blur > 0 ? `blur(${blur}px)` : undefined,
            }}
          >
            <AssetSlot id={pill.id} fallback={<Pill label={pill.label} />} />
          </div>
        );
      })}
    </>
  );
};

export const Reasons: React.FC<{ reasons: ReturnType<typeof useReasons> }> = ({ reasons }) => {
  return (
    <>
      {/* Same colour as Mist, so a shaking stage never shows an edge. */}
      <AbsoluteFill style={{ backgroundColor: COLORS.mist }} />
      <Shake at={[reasons.lineEnd, reasons.flatStart + FLAT_LINE_CONTACT]}>
        <MistBackground />
        <Camera keyframes={reasons.keyframes}>
          <World>
            {/* S3 */}
            <ExitText startFrame={TEXT_A_OUT}>
              <WordBuild layout={reasons.textA} startFrame={TEXT_A_START} />
            </ExitText>
            <PromoStack pills={reasons.pills} sinkStart={reasons.sinkStart} />
            <WordBuild layout={reasons.textB} startFrame={TEXT_B_START} />

            {/* S4 */}
            <WordBuild layout={reasons.s4Text} startFrame={S4_WORDS_START} />
            <RisingLine
              points={reasons.linePoints}
              bounds={reasons.lineBounds}
              startFrame={reasons.lineStart}
              durationInFrames={LINE_FRAMES}
            />

            {/* S5 */}
            <WordBuild layout={reasons.omzet} startFrame={reasons.omzetStart} />
            <FlatLine d={reasons.flatD} bounds={reasons.flatBounds} startFrame={reasons.flatStart} />
            <LebayWord layout={reasons.segitu} preset="squash" startFrame={reasons.squashStart} />
            <WordBuild layout={reasons.aja} startFrame={reasons.ajaStart} />
          </World>
        </Camera>
      </Shake>
    </>
  );
};
