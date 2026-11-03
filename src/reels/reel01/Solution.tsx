import { useMemo } from "react";
import { ChatCircle, Check, Heart, PaperPlaneTilt, ShoppingBag } from "@phosphor-icons/react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { AssetSlot } from "../AssetSlot";
import { MistBackground } from "../Backgrounds";
import { Camera, fitCamera, sentenceCamera, World, type CameraKeyframe, type CameraState } from "../camera";
import type { BoxCheck, SentenceCheck } from "../debug";
import { ExitText } from "../ExitText";
import { MorphBox, type MorphStep } from "../MorphBox";
import { PHONE_OUTER, PhoneFrame } from "../PhoneFrame";
import { CAMERA_ZOOM, COLORS, EASINGS, MOTION, TYPE, type TextStyle } from "../tokens";
import { WordBuild, wordTiming } from "../WordBuild";
import { layoutSentence, measureWidth, unionBox, type Box } from "../wordLayout";
import { SCENES } from "./timeline";

/**
 * S7-S9 share one world and hand over with no cut: the dot under the S7
 * sentence becomes the S8 phone, and the S9 question builds where the phone
 * was. Frames are local to this Sequence.
 */
const SCENE_START = SCENES.solution.from;
const AT = { x: 502, y: 900 };

/* S7 */
const S7_START = -2;
const DOT_POP = 68;
const DOT_FRAMES = 10;
const S7_HOLD_END = 72;
const S7_OUT = 76;
const DOT_ARRIVED = 84;

/* S8: first morph chain, dot to app tile to phone screen */
const TILE_START = 84;
const TILE_END = 98;
const SCREEN_END = 120;
const CAMERA_OUT_START = 89;
const CAMERA_OUT_END = 110;
const HEADLINE_START = 110;
const HEADLINE_GAP = 3;

/* S8: second morph chain, tag to card to button to pill */
const TAG_POP = 160;
const TAG_POP_FRAMES = 12;
const TAG_ZOOM_START = 167;
const TAG_ZOOM_END = 188;
const CARD_START = 181;
const CARD_END = 199;
const BUTTON_START = 211;
const BUTTON_END = 229;
const PILL_START = 241;
const PILL_END = 259;
const FINAL_FIT_START = 256;
const FINAL_FIT_END = 277;
const NO_FEE_START = 277;
const NO_FEE_GAP = 3;

/* S8 to S9 */
const S8_EXIT_FRAMES = 12;
const FURTHER_ZOOM = 0.72;

const SCREEN = { width: 520, height: 1100, radius: 56 } as const;
const STATUS_BAR = 40;
const POST_HEADER = 88;
const ACTION_ROW = 88;
const PHOTO_TOP = STATUS_BAR + POST_HEADER;
const TAG_SIZE = 96;

const NEUTRAL = "#EFEBE7";

const Bar: React.FC<{ width: number; height?: number }> = ({ width, height = 16 }) => (
  <div style={{ width, height, borderRadius: height / 2, background: NEUTRAL }} />
);

/** Rebuilt, not a screenshot: no real account names or marks. */
const InstagramStylePost: React.FC = () => (
  <div
    style={{
      position: "relative",
      flexShrink: 0,
      width: SCREEN.width,
      height: SCREEN.height,
      background: COLORS.card,
      color: COLORS.ink,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: STATUS_BAR,
        left: 24,
        height: POST_HEADER,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 28, background: NEUTRAL }} />
      <Bar width={170} />
    </div>
    <div style={{ position: "absolute", top: PHOTO_TOP, width: SCREEN.width, height: SCREEN.width }}>
      <AssetSlot id="TODO_PRODUCT_PHOTO" />
    </div>
    <div
      style={{
        position: "absolute",
        top: PHOTO_TOP + SCREEN.width,
        left: 24,
        height: ACTION_ROW,
        display: "flex",
        alignItems: "center",
        gap: 24,
      }}
    >
      <Heart size={48} weight="regular" />
      <ChatCircle size={48} weight="regular" />
      <PaperPlaneTilt size={48} weight="regular" />
    </div>
    <div
      style={{
        position: "absolute",
        top: PHOTO_TOP + SCREEN.width + ACTION_ROW + 8,
        left: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <Bar width={380} />
      <Bar width={280} />
    </div>
    <div
      style={{
        position: "absolute",
        top: PHOTO_TOP + SCREEN.width + ACTION_ROW + 104,
        left: 0,
        right: 0,
        bottom: 0,
        background: NEUTRAL,
      }}
    />
  </div>
);

const uiText = (style: TextStyle, color: string): React.CSSProperties => ({
  fontFamily: style.fontFamily,
  fontWeight: style.fontWeight,
  fontSize: style.fontSize,
  lineHeight: style.lineHeight,
  color,
  whiteSpace: "pre",
});

export function useSolution(noFeeLine: string) {
  return useMemo(() => {
    /* ---------- layout ---------- */
    const s7Text = layoutSentence({
      lines: ["~~Solusinya: buka~~", "**jalur jualan** __sendiri.__"],
      style: TYPE.sentence,
      center: { x: AT.x, y: AT.y - 140 },
    });
    const headlineHeight = TYPE.sentence.fontSize * TYPE.sentence.lineHeight * 2;
    const phoneTop = AT.y - PHONE_OUTER.height / 2;
    const phoneBottom = AT.y + PHONE_OUTER.height / 2;
    const headline = layoutSentence({
      lines: ["~~Keranjang putih~~ __Instagram__", "→ ~~bayar di~~ **website kamu**."],
      style: TYPE.sentence,
      center: { x: AT.x, y: phoneTop - 50 - headlineHeight / 2 },
    });
    const noFee = layoutSentence({
      lines: [noFeeLine],
      style: TYPE.sentence,
      center: { x: AT.x, y: phoneBottom + 50 + (TYPE.sentence.fontSize * TYPE.sentence.lineHeight) / 2 },
    });
    const s9Text = layoutSentence({
      lines: ["~~Mau diajarin~~ __jualan__", "~~langsung dari~~ **Instagram**?"],
      style: TYPE.sentence,
      center: AT,
    });

    const phoneBox: Box = {
      x: AT.x - PHONE_OUTER.width / 2,
      y: phoneTop,
      width: PHONE_OUTER.width,
      height: PHONE_OUTER.height,
    };
    const screenTop = AT.y - SCREEN.height / 2;
    // Centred on the screen: the tag grows into a pill nearly as wide as the screen.
    const tagAt = { x: AT.x, y: screenTop + PHOTO_TOP + SCREEN.width / 2 };

    /* The label sets the button's width: at the 34 px minimum it doesn't fit the brief's 380. */
    const buttonLabel = "Bayar di tokokamu.com";
    const buttonWidth = Math.max(380, measureWidth(buttonLabel, TYPE.uiBody) + 56);
    const card = { width: 360, height: 200 };
    const button = { width: buttonWidth, height: 96 };
    const pill = { width: 440, height: 96 };
    const centred = (size: { width: number; height: number }): Box => ({
      x: tagAt.x - size.width / 2,
      y: tagAt.y - size.height / 2,
      ...size,
    });

    /* ---------- morph chains ---------- */
    const screenChain: MorphStep[] = [
      {
        start: DOT_POP,
        end: DOT_POP,
        state: { width: 28, height: 28, radius: 14, background: COLORS.plum, shadow: 0 },
      },
      {
        start: TILE_START,
        end: TILE_END,
        state: {
          width: 160,
          height: 160,
          radius: 40,
          background: COLORS.plum,
          shadow: 1,
          content: (
            <div style={{ width: 96, height: 96 }}>
              <AssetSlot
                id="TODO_IG_ICON"
                style={{
                  fontSize: 13,
                  color: COLORS.cream,
                  background: "rgba(255,233,190,.12)",
                  border: "1px solid rgba(255,233,190,.3)",
                }}
              />
            </div>
          ),
        },
      },
      {
        start: TILE_END,
        end: SCREEN_END,
        state: {
          width: SCREEN.width,
          height: SCREEN.height,
          radius: SCREEN.radius,
          background: COLORS.card,
          shadow: 0,
          content: <InstagramStylePost />,
        },
      },
    ];
    const tagChain: MorphStep[] = [
      {
        start: TAG_POP,
        end: TAG_POP,
        state: {
          width: TAG_SIZE,
          height: TAG_SIZE,
          radius: TAG_SIZE / 2,
          background: COLORS.card,
          shadow: 1,
          content: <ShoppingBag size={52} weight="regular" color={COLORS.ink} />,
        },
      },
      {
        start: CARD_START,
        end: CARD_END,
        state: {
          ...card,
          radius: 28,
          background: COLORS.card,
          shadow: 1,
          content: (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={uiText(TYPE.uiBody, COLORS.ink)}>Serum 30 ml</div>
              <div style={uiText(TYPE.uiLabel, COLORS.ink)}>Rp100.000</div>
            </div>
          ),
        },
      },
      {
        start: BUTTON_START,
        end: BUTTON_END,
        state: {
          ...button,
          radius: 48,
          background: COLORS.plum,
          shadow: 1,
          content: <div style={uiText({ ...TYPE.uiBody, fontWeight: 600 }, COLORS.cream)}>{buttonLabel}</div>,
        },
      },
      {
        start: PILL_START,
        end: PILL_END,
        state: {
          ...pill,
          radius: 48,
          background: COLORS.plum,
          shadow: 1,
          content: (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Check size={40} weight="bold" color={COLORS.cream} />
              <div style={uiText(TYPE.uiLabel, COLORS.cream)}>Pesanan masuk</div>
            </div>
          ),
        },
      },
    ];

    /* ---------- camera ---------- */
    const s7Camera = sentenceCamera({ layout: s7Text, startFrame: S7_START });
    const s7Hold = fitCamera(s7Text.box);
    const dotCamera: CameraState = { x: AT.x, y: AT.y, s: CAMERA_ZOOM.dot };
    const phoneFit = fitCamera(unionBox(headline.box, phoneBox));
    const tagCamera: CameraState = { ...tagAt, s: CAMERA_ZOOM.tag };
    const finalFit = fitCamera(unionBox(headline.box, phoneBox, noFee.box));

    const headlineSettled = wordTiming(headline, HEADLINE_START, HEADLINE_GAP).settled;
    const noFeeTiming = wordTiming(noFee, NO_FEE_START, NO_FEE_GAP);
    const exitStart = noFeeTiming.settled + MOTION.holdMin;
    const exitEnd = exitStart + S8_EXIT_FRAMES;

    const further: CameraState = { ...finalFit, s: FURTHER_ZOOM };
    const s9Start = exitEnd;
    const s9Camera = sentenceCamera({
      layout: s9Text,
      startFrame: s9Start,
      enter: { from: further, frame: exitEnd, duration: 12 },
    });
    const end = SCENES.solution.durationInFrames;

    const keyframes: CameraKeyframe[] = [
      ...s7Camera.keyframes,
      { frame: S7_HOLD_END, ...s7Hold, ease: "linear" },
      { frame: DOT_ARRIVED, ...dotCamera },
      { frame: CAMERA_OUT_START, ...dotCamera, ease: "linear" },
      { frame: CAMERA_OUT_END, ...phoneFit },
      { frame: TAG_ZOOM_START, ...phoneFit, ease: "linear" },
      { frame: TAG_ZOOM_END, ...tagCamera },
      { frame: FINAL_FIT_START, ...tagCamera, ease: "linear" },
      { frame: FINAL_FIT_END, ...finalFit },
      { frame: exitStart, ...finalFit, ease: "linear" },
      { frame: exitEnd - 1, ...further },
      ...s9Camera.keyframes,
    ];

    /* ---------- dev checks ---------- */
    const sentenceChecks: SentenceCheck[] = [
      {
        id: "S7 text",
        sceneStart: SCENE_START,
        layout: s7Text,
        keyframes,
        starts: s7Camera.starts,
        holdStart: s7Camera.holdStart,
        holdEnd: S7_HOLD_END,
      },
      {
        id: "S8 headline",
        sceneStart: SCENE_START,
        layout: headline,
        keyframes,
        starts: wordTiming(headline, HEADLINE_START, HEADLINE_GAP).starts,
        holdStart: headlineSettled,
        holdEnd: TAG_ZOOM_START,
      },
      {
        id: "S8 no-fee line",
        sceneStart: SCENE_START,
        layout: noFee,
        keyframes,
        starts: noFeeTiming.starts,
        holdStart: noFeeTiming.settled,
        holdEnd: exitStart,
      },
      {
        id: "S9 text",
        sceneStart: SCENE_START,
        layout: s9Text,
        keyframes,
        starts: s9Camera.starts,
        holdStart: s9Camera.holdStart,
        holdEnd: end,
      },
    ];
    const boxChecks: BoxCheck[] = [
      {
        id: "S7 dot",
        sceneStart: SCENE_START,
        keyframes,
        from: DOT_POP,
        to: DOT_ARRIVED,
        boxAt: () => ({ x: AT.x - 14, y: AT.y - 14, width: 28, height: 28 }),
      },
      {
        id: "S8 phone + headline",
        sceneStart: SCENE_START,
        keyframes,
        from: CAMERA_OUT_END,
        to: TAG_ZOOM_START,
        boxAt: () => unionBox(headline.box, phoneBox),
      },
      {
        id: "S8 product card",
        sceneStart: SCENE_START,
        keyframes,
        from: CARD_END,
        to: BUTTON_START,
        boxAt: () => centred(card),
      },
      {
        id: "S8 button",
        sceneStart: SCENE_START,
        keyframes,
        from: BUTTON_END,
        to: PILL_START,
        boxAt: () => centred(button),
      },
      {
        id: "S8 pill",
        sceneStart: SCENE_START,
        keyframes,
        from: PILL_END,
        to: FINAL_FIT_END,
        boxAt: () => centred(pill),
      },
      {
        id: "S8 phone + headline + no-fee line",
        sceneStart: SCENE_START,
        keyframes,
        from: FINAL_FIT_END,
        to: exitStart,
        boxAt: () => unionBox(headline.box, phoneBox, noFee.box),
      },
    ];

    return {
      s7Text,
      headline,
      noFee,
      s9Text,
      screenChain,
      tagChain,
      tagAt,
      exitStart,
      exitEnd,
      s9Start,
      keyframes,
      sentenceChecks,
      boxChecks,
    };
  }, [noFeeLine]);
}

export const Solution: React.FC<{ solution: ReturnType<typeof useSolution> }> = ({ solution }) => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const dotScale = interpolate(frame, [DOT_POP, DOT_POP + DOT_FRAMES], [0, 1], { ...clamp, easing: EASINGS.pop });
  const tagScale = interpolate(frame, [TAG_POP, TAG_POP + TAG_POP_FRAMES], [0, 1], { ...clamp, easing: EASINGS.pop });
  const phoneDrop = interpolate(frame, [solution.exitStart, solution.exitEnd], [0, 1700], {
    ...clamp,
    easing: Easing.in(Easing.cubic),
  });

  return (
    <>
      <AbsoluteFill style={{ backgroundColor: COLORS.mist }} />
      <MistBackground />
      <Camera keyframes={solution.keyframes}>
        <World>
          {/* S7 */}
          <ExitText startFrame={S7_OUT}>
            <WordBuild layout={solution.s7Text} startFrame={S7_START} />
          </ExitText>

          {/* S8: everything that leaves together as S9 starts */}
          {frame < solution.exitEnd ? (
            <AbsoluteFill style={{ translate: `0px ${phoneDrop}px`, overflow: "visible" }}>
              <PhoneFrame x={AT.x} y={AT.y} startFrame={TILE_END} />
              <div
                style={{
                  position: "absolute",
                  left: AT.x,
                  top: AT.y,
                  scale: frame < TILE_START ? String(dotScale) : undefined,
                }}
              >
                <MorphBox x={0} y={0} steps={solution.screenChain} from={DOT_POP} />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: solution.tagAt.x,
                  top: solution.tagAt.y,
                  scale: frame < CARD_START ? String(tagScale) : undefined,
                }}
              >
                <MorphBox x={0} y={0} steps={solution.tagChain} from={TAG_POP} />
              </div>
            </AbsoluteFill>
          ) : null}
          <ExitText startFrame={solution.exitStart}>
            <WordBuild layout={solution.headline} startFrame={HEADLINE_START} gap={HEADLINE_GAP} />
            <WordBuild layout={solution.noFee} startFrame={NO_FEE_START} gap={NO_FEE_GAP} />
          </ExitText>

          {/* S9 */}
          <WordBuild layout={solution.s9Text} startFrame={solution.s9Start} />
        </World>
      </Camera>
    </>
  );
};
