import { useCurrentFrame } from "remotion";
import { storyFlat, type StoryScreen } from "../../assets";
import { easedInterpolate } from "../../theme/motion";
import { useLayout, type Layout } from "../../useLayout";
import { Caption } from "../components/Caption";
import { CHAT, useChatEntrance } from "../components/chat/chatTheme";
import { TypingIndicator } from "../components/chat/TypingIndicator";
import { Highlight, type HotspotRect } from "../components/Highlight";
import { PHONE_ASPECT, PHONE_SCREEN, PhoneFrame } from "../components/PhoneFrame";
import { PngSlice } from "../components/PngSlice";
import { TapRipple } from "../components/TapRipple";
import { StickerTag } from "../senja/StickerTag";
import { Surface } from "../senja/Surface";
import { settledTilt } from "../senja/tilt";
import { Vault } from "../senja/Vault";
import type { SceneComponent } from "./index";

/** Act 4 sits on Night. */
const SURFACE = "night";

/** One phone, right of the caption in 16:9 and below it in 9:16. */
function getStage(layout: Layout) {
  const { width: W, height: H } = layout;
  if (layout.isPortrait) {
    const phoneW = W * 0.56;
    return { cx: W * 0.5, top: H * 0.33, phoneW, phoneH: phoneW * PHONE_ASPECT, vault: { centerX: W * 0.5, top: H * 0.44, width: W * 0.88 } };
  }
  const phoneW = H * 0.4;
  return { cx: W * 0.7, top: H * 0.09, phoneW, phoneH: phoneW * PHONE_ASPECT, vault: { centerX: W * 0.7, top: H * 0.3, width: W * 0.38 } };
}

/** The phone on its stage: rises in over the first 24 frames, tilt passed in. */
const StagedPhone: React.FC<{ src?: string; tilt: number; rise?: boolean; children?: React.ReactNode }> = ({ src, tilt, rise = false, children }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const stage = getStage(layout);
  const r = rise ? easedInterpolate(frame, [0, 24], [1, 0]) : 0;

  return (
    <div
      style={{
        position: "absolute",
        left: stage.cx - stage.phoneW / 2,
        top: stage.top,
        transform: `translateY(${r * layout.height * 0.3}px)`,
        opacity: 1 - r,
      }}
    >
      <PhoneFrame src={src} width={stage.phoneW} tilt={tilt}>
        {children}
      </PhoneFrame>
    </div>
  );
};

/* ------------------------------------------------------------------------ */
/* Chat threads (4a, 4d): the flat PNG supplies the header, input bar and    */
/* every message's exact pixels. The thread area is painted over with the    */
/* chat background, then each message is cut back in from the PNG and       */
/* arrives on its own — incoming ones after a typing indicator.              */
/* ------------------------------------------------------------------------ */

/** Thread area of 11 and 14, between the header and the input bar. */
const THREAD = { top: 117, bottom: 761 } as const;

type ThreadItem = {
  /** Block bounds in screen points, measured by scanning for non-background rows. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** "chip" = date separator (fades in), "in"/"out" = messages. */
  kind: "chip" | "in" | "out";
  startFrame: number;
  typingFrames?: number;
};

const ThreadBlock: React.FC<{ src: string; item: ThreadItem }> = ({ src, item }) => {
  const { typing, typingIn, enter, visible } = useChatEntrance(item.startFrame, item.kind === "in" ? (item.typingFrames ?? 0) : 0);
  const origin = item.kind === "out" ? "bottom right" : item.kind === "in" ? "top left" : "center";

  return (
    <>
      {typing ? <TypingIndicator style={{ position: "absolute", left: item.x, top: item.y, opacity: typingIn }} /> : null}
      <PngSlice
        src={src}
        imageWidth={PHONE_SCREEN.width}
        imageHeight={PHONE_SCREEN.height}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        style={{
          left: item.x,
          top: item.y,
          opacity: visible ? enter : 0,
          transform: item.kind === "chip" ? undefined : `translateY(${(1 - enter) * 10}px) scale(${0.92 + 0.08 * enter})`,
          transformOrigin: origin,
        }}
      />
    </>
  );
};

const ChatThread: React.FC<{ screen: StoryScreen; items: ThreadItem[] }> = ({ screen, items }) => {
  const src = storyFlat(screen);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: THREAD.top,
          width: PHONE_SCREEN.width,
          height: THREAD.bottom - THREAD.top,
          backgroundColor: CHAT.background,
        }}
      />
      {items.map((item) => (
        <ThreadBlock key={item.y} src={src} item={item} />
      ))}
    </>
  );
};

/** Blocks of flat/11-wa-confirmation.png (rows scanned against #F2EEE6). */
const WA_11: ThreadItem[] = [
  { kind: "chip", x: 143, y: 117, width: 107, height: 25, startFrame: 0 },
  { kind: "in", x: 14, y: 154, width: 307, height: 96, startFrame: 14, typingFrames: 10 },
  { kind: "in", x: 14, y: 258, width: 299, height: 183, startFrame: 32, typingFrames: 8 },
  { kind: "chip", x: 163, y: 453, width: 67, height: 27, startFrame: 44 },
  { kind: "in", x: 14, y: 492, width: 299, height: 194, startFrame: 58, typingFrames: 10 },
  { kind: "out", x: 123, y: 694, width: 256, height: 55, startFrame: 78 },
];
/** The "Sudah dikirim · Paket dalam perjalanan" card with the resi. */
const SHIPPED_CARD_11: HotspotRect = { x: 14, y: 492, width: 299, height: 194, radius: 18 };
const SHIPPED_AT = 58;

/** Blocks of flat/14-repeat-order.png. */
const WA_14: ThreadItem[] = [
  { kind: "in", x: 14, y: 119, width: 307, height: 96, startFrame: 12, typingFrames: 10 },
  { kind: "in", x: 14, y: 223, width: 299, height: 218, startFrame: 28, typingFrames: 8 },
  { kind: "out", x: 102, y: 449, width: 277, height: 75, startFrame: 54 },
  { kind: "in", x: 14, y: 532, width: 299, height: 217, startFrame: 70, typingFrames: 8 },
];
/** "Beli lagi" button inside the Warna baru card. */
const BELI_LAGI_14 = { x: 163, y: 396 } as const;
const SIAP_CHECKOUT_14: HotspotRect = { x: 14, y: 532, width: 299, height: 217, radius: 18 };
const CHECKOUT_AT = 70;

/** 4a — the confirmation, then the shipping card with the resi, arrive in WhatsApp. */
const Scene4a: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const stage = getStage(layout);

  return (
    <Surface kind={SURFACE} glowFrom={24}>
      <Vault {...stage.vault} />
      <StagedPhone tilt={settledTilt(frame, SHIPPED_AT, -5, layout, 30)} rise src={storyFlat("11-wa-confirmation")}>
        <ChatThread screen="11-wa-confirmation" items={WA_11} />
        <Highlight rect={SHIPPED_CARD_11} startFrame={SHIPPED_AT + 6} />
      </StagedPhone>
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

/* ------------------------------------------------------------------------ */
/* 4b — tracking: the four progress bars on 12's green header fill in order. */
/* ------------------------------------------------------------------------ */

/** flat/12-tracking.png progress bars (white, y 225–230) and the green header card. */
const BARS_12 = { y: 225, height: 5, segments: [[38, 114], [119, 194], [199, 275], [280, 355]] as [number, number][] };
const HEADER_12: HotspotRect = { x: 20, y: 112, width: 353, height: 156, radius: 22 };
/** Header green sampled either side of the bar row (it darkens slightly to the right). */
const HEADER_GREEN = { left: "#2C8555", right: "#2D784F" };
const ARRIVED_AT = 46;

const Scene4b: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const stage = getStage(layout);

  return (
    <Surface kind={SURFACE} glowFrom={20}>
      <Vault {...stage.vault} />
      <StagedPhone tilt={settledTilt(frame, ARRIVED_AT, 5, layout, 30)} src={storyFlat("12-tracking")}>
        {/* Paint out the PNG's filled bars, then redraw them as tracks that fill one after another. */}
        <div
          style={{
            position: "absolute",
            left: 30,
            top: BARS_12.y - 2,
            width: 333,
            height: BARS_12.height + 4,
            background: `linear-gradient(90deg, ${HEADER_GREEN.left}, ${HEADER_GREEN.right})`,
          }}
        />
        {BARS_12.segments.map(([x0, x1], i) => {
          const fill = easedInterpolate(frame, [8 + i * 9, 18 + i * 9], [0, 1]);
          return (
            <div
              key={x0}
              style={{
                position: "absolute",
                left: x0,
                top: BARS_12.y,
                width: x1 - x0,
                height: BARS_12.height,
                borderRadius: BARS_12.height / 2,
                backgroundColor: "rgba(255,255,255,0.28)",
                overflow: "hidden",
              }}
            >
              <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: BARS_12.height / 2, backgroundColor: "#FFFFFF" }} />
            </div>
          );
        })}
        <Highlight rect={HEADER_12} startFrame={ARRIVED_AT} />
      </StagedPhone>
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

/* ------------------------------------------------------------------------ */
/* 4c — review: the five stars on 13 pop in one by one, then the label.      */
/* ------------------------------------------------------------------------ */

const REVIEW_BG_13 = "#F7F3EA";
/** Star centres (y 262–294) and the "Puas banget!" label, from flat/13-review.png. */
const STARS_13 = { xs: [93, 145, 197, 249, 301], top: 258, height: 41, cellWidth: 48 };
const LABEL_13 = { x: 140, y: 311, width: 112, height: 23 };
const STARS_AT = 10;
const STAR_STAGGER = 5;
const RATED_AT = STARS_AT + STAR_STAGGER * 4 + 8;

const StarPop: React.FC<{ src: string; cx: number; startFrame: number }> = ({ src, cx, startFrame }) => {
  const { enter, visible } = useChatEntrance(startFrame);
  const { top, height, cellWidth } = STARS_13;
  return (
    <PngSlice
      src={src}
      imageWidth={PHONE_SCREEN.width}
      imageHeight={PHONE_SCREEN.height}
      x={cx - cellWidth / 2}
      y={top}
      width={cellWidth}
      height={height}
      style={{
        left: cx - cellWidth / 2,
        top,
        opacity: visible ? Math.min(1, enter * 1.5) : 0,
        transform: `scale(${0.3 + 0.7 * enter}) rotate(${(1 - enter) * -40}deg)`,
      }}
    />
  );
};

const Scene4c: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const stage = getStage(layout);
  const src = storyFlat("13-review");
  const label = useChatEntrance(RATED_AT);

  return (
    <Surface kind={SURFACE} glowFrom={20}>
      <Vault {...stage.vault} />
      <StagedPhone tilt={settledTilt(frame, RATED_AT, -5, layout, 30)} src={src}>
        {/* Paint out the stars and label, then cut them back in from the PNG. */}
        <div style={{ position: "absolute", left: 64, top: STARS_13.top, width: 266, height: LABEL_13.y + LABEL_13.height - STARS_13.top + 2, backgroundColor: REVIEW_BG_13 }} />
        {STARS_13.xs.map((cx, i) => (
          <StarPop key={cx} src={src} cx={cx} startFrame={STARS_AT + i * STAR_STAGGER} />
        ))}
        <PngSlice
          src={src}
          imageWidth={PHONE_SCREEN.width}
          imageHeight={PHONE_SCREEN.height}
          {...LABEL_13}
          style={{
            left: LABEL_13.x,
            top: LABEL_13.y,
            opacity: label.visible ? label.enter : 0,
            transform: `translateY(${(1 - label.enter) * 8}px)`,
          }}
        />
      </StagedPhone>
      <StickerTag
        text="★ 5,0"
        // Starts on the phone's right bezel so the Senja tag never covers the client screen.
        x={stage.cx + stage.phoneW * 0.47}
        y={stage.top + stage.phoneH * (layout.isPortrait ? 0.24 : 0.26)}
        rotate={-5}
        startFrame={RATED_AT + 4}
      />
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

/** 4d — a month later: the new-colour offer, "Beli lagi", and checkout with the saved details. */
const Scene4d: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const stage = getStage(layout);

  return (
    <Surface kind={SURFACE} glowFrom={24}>
      <Vault {...stage.vault} />
      <StagedPhone tilt={settledTilt(frame, CHECKOUT_AT, 5, layout, 30)} src={storyFlat("14-repeat-order")}>
        <ChatThread screen="14-repeat-order" items={WA_14} />
        <TapRipple x={BELI_LAGI_14.x} y={BELI_LAGI_14.y} startFrame={44} color={CHAT.outgoing} />
        <Highlight rect={SIAP_CHECKOUT_14} startFrame={CHECKOUT_AT + 6} />
      </StagedPhone>
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

export const ACT4_SCENES = { "4a": Scene4a, "4b": Scene4b, "4c": Scene4c, "4d": Scene4d };
