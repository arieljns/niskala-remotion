import { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TapRipple } from "../TapRipple";
import { MistBackground } from "../Backgrounds";
import { Camera, cameraAt, World, type CameraKeyframe, type CameraState } from "../camera";
import type { BoxCheck } from "../debug";
import { ExitText } from "../ExitText";
import { MorphBox } from "../MorphBox";
import { COLORS, EASINGS, FOCAL } from "../tokens";
import { CHECKOUT_END, CHECKOUT_SCROLL, CheckoutPage } from "../ui/ios/CheckoutPage";
import { DmBubble, FollowerToast, IosNotification, NOTIFICATION } from "../ui/ios/Floating";
import { IG_CTA, IgProductPage } from "../ui/ios/IgProductPage";
import { BrowserSkeleton, InAppBrowser, URL_BOX } from "../ui/ios/InAppBrowser";
import { PhoneShell } from "../ui/ios/PhoneShell";
import { ProductSheet, SHEET_HERO_CARD } from "../ui/ios/ProductSheet";
import { PROFILE_FIRST_TILE, ProfileScreen } from "../ui/ios/ProfileScreen";
import { PILL_BOX, ReelScreen } from "../ui/ios/ReelScreen";
import { STORE_BUY, StorePage } from "../ui/ios/StorePage";
import { SuccessScreen } from "../ui/ios/SuccessScreen";
import { PHONE, PHONE_OUTER, PUSH_FRAMES, SHEET_SPRING, pressAmount, pushProgress } from "../ui/ios/tokens";
import { WordBuild } from "../WordBuild";
import { unionBox, type Box, type SentenceLayout } from "../wordLayout";
import { buildHeadlines, Headline, type HeadlineSpec } from "./Headlines";
import { LINES } from "./copy";
import { AT, DOT_SIZE } from "./Solution";
import type { ReelTimeline } from "./timeline";

/** World pixels per phone point. */
const PHONE_SCALE = 1.3;
const OUTER = {
  width: PHONE_OUTER.width * PHONE_SCALE,
  height: PHONE_OUTER.height * PHONE_SCALE,
  radius: PHONE_OUTER.radius * PHONE_SCALE,
};
const PHONE_WORLD = { x: AT.x - OUTER.width / 2, y: AT.y - OUTER.height / 2 };

/** A box in phone points, as a world box. */
const worldBox = (box: Box): Box => ({
  x: PHONE_WORLD.x + (PHONE.bezel + box.x) * PHONE_SCALE,
  y: PHONE_WORLD.y + (PHONE.bezel + box.y) * PHONE_SCALE,
  width: box.width * PHONE_SCALE,
  height: box.height * PHONE_SCALE,
});
/** Lands a box on the focal point, or `screenY` when it sits low in the phone and more of the screen should stay in view. */
const focus = (box: Box, s: number, screenY: number = FOCAL.y): CameraState => {
  const world = worldBox(box);
  return { x: world.x + world.width / 2, y: world.y + world.height / 2 - (screenY - FOCAL.y) / s, s };
};
const centerOf = (box: Box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

/** The phone under the headlines. Its top edge lands just under them. */
const WIDE: CameraState = { x: AT.x, y: 762, s: 1 };
const ZOOM = { pill: 1.8, cta: 1.6, url: 2, total: 1.5, notification: 1.6 } as const;
/** Screen height for targets near the bottom of the phone, so it fills the frame down to the safe zone. */
const LOW_TARGET_Y = 1200;
/** Includes the success check under the banner, not just the banner. */
const NOTIFICATION_VIEW: Box = { x: NOTIFICATION.x, y: 130, width: NOTIFICATION.width, height: 80 };
const S9_START: CameraState = { x: AT.x, y: 772, s: 0.78 };
const S9_DRIFT = 1.04;

const MORPH_START = 4;
const MORPH_FRAMES = 30;
const SKELETON_FRAMES = 6;
const SIGNAL_STAGGER = 30;

type FlowScenes = Pick<ReelTimeline["scenes"], "s7" | "s7b" | "s8a" | "s8b" | "s8c" | "s8d" | "s9">;

const DARK_TAP = COLORS.ink;
const LIGHT_TAP = COLORS.cream;

export function usePhoneFlow(scenes: FlowScenes, s7Keyframes: readonly CameraKeyframe[], s7Sentence: SentenceLayout) {
  return useMemo(() => {
    const { s7, s7b, s8a, s8b, s8c, s8d, s9 } = scenes;
    /* Scene starts, in this Sequence's frames. */
    const a = s7b.durationInFrames;
    const b = a + s8a.durationInFrames;
    const c = b + s8b.durationInFrames;
    const d = c + s8c.durationInFrames;
    const e = d + s8d.durationInFrames;
    const durationInFrames = e + s9.durationInFrames;

    const t = {
      morphEnd: MORPH_START + MORPH_FRAMES,
      tileTap: a - 16,
      reelPush: a - 12,
      pillPop: a + s8a.cues[2],
      pillTap: b + 4,
      sheetIn: b + 7,
      cardTap: b + 22,
      igPush: b + 26,
      ctaTap: c - 16,
      browserIn: c - 10,
      storeShown: c - 10 + 16 + SKELETON_FRAMES,
      progressEnd: d - 14,
      buyTap: d + 12,
      checkoutPush: d + 15,
      rollStart: d + 22,
      scrollStart: d + 21,
      scrollEnd: d + 33,
      payTap: d + 38,
      successIn: d + 41,
      notification: d + s8d.cues[1],
      notificationOut: e + 26,
      signals: e + s9.cues[2],
    };

    const pillView = focus(PILL_BOX, ZOOM.pill, LOW_TARGET_Y - 140);
    const ctaView = focus(IG_CTA, ZOOM.cta, LOW_TARGET_Y);
    const urlView = focus(URL_BOX, ZOOM.url);
    const totalBox = unionBox(CHECKOUT_END.total, CHECKOUT_END.pay);
    const totalView = focus(totalBox, ZOOM.total, LOW_TARGET_Y);
    const notificationView = focus(NOTIFICATION_VIEW, ZOOM.notification);
    const s7End = cameraAt(s7Keyframes, s7.durationInFrames);
    const s9End = { ...S9_START, s: S9_START.s * S9_DRIFT };

    /** Holds where it is until `from`, then moves to `to`, arriving at `end`. */
    const moves: readonly [number, number, CameraState][] = [
      [0, MORPH_START + 14, WIDE],
      [t.pillPop + 12, t.pillPop + 30, pillView],
      [b + 6, b + 20, WIDE],
      [b + 44, b + 60, ctaView],
      [c - 8, c + 16, urlView],
      [d + 1, d + 11, WIDE],
      [d + 24, d + 36, totalView],
      [d + 41, d + 57, notificationView],
      [e, e + 20, S9_START],
    ];
    const keyframes: CameraKeyframe[] = [{ ...s7End, frame: 0 }];
    moves.forEach(([from, end, to]) => {
      keyframes.push({ ...cameraAt(keyframes, from), frame: from, ease: "linear" });
      keyframes.push({ ...to, frame: end, ease: undefined });
    });
    keyframes.push({ ...s9End, frame: durationInFrames, ease: "linear" });

    const specs: HeadlineSpec[] = [
      ...LINES.s7b.map((line) => ({ scene: s7b, offset: 0, lines: line.lines, at: line.at })),
      ...LINES.s8a.map((line) => ({ scene: s8a, offset: a, lines: line.lines, at: line.at })),
      ...LINES.s8b.map((line) => ({ scene: s8b, offset: b, lines: line.lines, at: line.at })),
      ...LINES.s8c.map((line) => ({ scene: s8c, offset: c, lines: line.lines, at: line.at })),
      ...LINES.s8d.map((line) => ({ scene: s8d, offset: d, lines: line.lines, at: line.at })),
      ...LINES.s9.map((line) => ({ scene: s9, offset: e, lines: line.lines, at: line.at })),
    ];
    const headlines = buildHeadlines(specs);

    const tap = (box: Box) => centerOf(box);
    const taps = [
      { at: t.tileTap, until: t.reelPush + 4, ...tap(PROFILE_FIRST_TILE), color: DARK_TAP },
      { at: t.pillTap, until: t.sheetIn + 4, ...tap(PILL_BOX), color: LIGHT_TAP },
      { at: t.cardTap, until: t.igPush + 4, ...tap(SHEET_HERO_CARD), color: LIGHT_TAP },
      { at: t.ctaTap, until: t.browserIn + 6, ...tap(IG_CTA), color: LIGHT_TAP },
      { at: t.buyTap, until: t.checkoutPush + 4, ...tap(STORE_BUY), color: LIGHT_TAP },
      { at: t.payTap, until: t.successIn + 3, ...tap(CHECKOUT_END.pay), color: LIGHT_TAP },
    ];

    const held = (id: string, from: number, to: number, box: Box, area?: "frame"): BoxCheck => ({
      id,
      sceneStart: s7b.from,
      keyframes,
      from,
      to,
      boxAt: () => box,
      area,
    });
    const boxChecks: BoxCheck[] = [
      held("S8 pill zoom", t.pillPop + 30, b + 6, worldBox(PILL_BOX)),
      held("S8 Lihat di website zoom", b + 60, c - 8, worldBox(IG_CTA)),
      held("S8 URL bar zoom", c + 16, d, worldBox(URL_BOX)),
      held("S8 Beli sekarang on tap", t.buyTap, t.buyTap + 4, worldBox(STORE_BUY)),
      held("S8 total + Bayar zoom", d + 36, d + 41, worldBox(totalBox)),
      held("S8 notification zoom", d + 57, e, worldBox(NOTIFICATION)),
      held("S7b-S9 phone in frame while wide", t.morphEnd, t.pillPop + 12, { ...PHONE_WORLD, ...OUTER }, "frame"),
    ];

    return {
      t,
      a,
      b,
      c,
      d,
      e,
      s7Offset: s7.durationInFrames,
      s7Sentence,
      durationInFrames,
      keyframes,
      headlines,
      taps,
      sentenceChecks: headlines.map((line) => line.check),
      boxChecks,
      sfx: taps.map((item) => ({ id: "TODO_SFX_TAP" as const, frame: s7b.from + item.at })),
      pillSfx: s7b.from + t.pillPop,
      notificationSfx: s7b.from + t.notification,
    };
  }, [s7Keyframes, s7Sentence, scenes]);
}

export type PhoneFlowData = ReturnType<typeof usePhoneFlow>;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Layer: React.FC<{ x?: number; y?: number; dim?: number; children: React.ReactNode }> = ({ x = 0, y = 0, dim = 0, children }) => (
  <div style={{ position: "absolute", inset: 0, transform: x || y ? `translate(${x}px, ${y}px)` : undefined }}>
    {children}
    {dim > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${dim})` }} /> : null}
  </div>
);

const PUSH_PARALLAX = -PHONE.width * 0.3;
const PUSH_DIM = 0.12;
const REEL_DIM = 0.6;

const PhoneScreens: React.FC<{ flow: PhoneFlowData }> = ({ flow }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { t } = flow;
  const reelP = pushProgress(frame, t.reelPush);
  const igP = pushProgress(frame, t.igPush);
  const checkoutP = pushProgress(frame, t.checkoutPush, 10);
  const successP = pushProgress(frame, t.successIn, 7);
  const sheet = spring({ frame: Math.max(0, frame - t.sheetIn), fps, config: SHEET_SPRING });
  const browser = spring({ frame: Math.max(0, frame - t.browserIn), fps, config: SHEET_SPRING });
  const browserCovers = frame >= t.browserIn + 18;
  const pillPop = interpolate(frame, [t.pillPop, t.pillPop + 12], [0, 1], { ...clamp, easing: EASINGS.pop });
  const pillPulse = interpolate(frame, [t.pillPop + 14, t.pillPop + 20, t.pillPop + 28], [1, 1.05, 1], clamp);
  const progress = interpolate(frame, [t.browserIn + 4, t.progressEnd], [0.08, 1], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 2) });
  const scroll = interpolate(frame, [t.scrollStart, t.scrollEnd], [0, CHECKOUT_SCROLL], { ...clamp, easing: EASINGS.camera });

  const notificationIn = spring({ frame: Math.max(0, frame - t.notification), fps, config: SHEET_SPRING });
  const notificationOut = interpolate(frame, [t.notificationOut, t.notificationOut + 10], [0, 1], { ...clamp, easing: EASINGS.brand });
  const notificationY = -110 + (NOTIFICATION.y + 110) * notificationIn - 140 * notificationOut;

  return (
    <>
      {frame < t.reelPush + PUSH_FRAMES ? (
        <Layer x={PUSH_PARALLAX * reelP} dim={PUSH_DIM * reelP}>
          <ProfileScreen firstTilePress={pressAmount(frame, t.tileTap)} />
        </Layer>
      ) : null}
      {frame >= t.reelPush && !browserCovers ? (
        <Layer x={PHONE.width * (1 - reelP) + PUSH_PARALLAX * igP} dim={PUSH_DIM * igP}>
          <ReelScreen pill={{ pop: pillPop * pillPulse, press: pressAmount(frame, t.pillTap) }} />
          {frame >= t.sheetIn ? (
            <>
              <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${REEL_DIM * sheet})` }} />
              <ProductSheet slide={sheet} heroPress={pressAmount(frame, t.cardTap)} />
            </>
          ) : null}
        </Layer>
      ) : null}
      {frame >= t.igPush && !browserCovers ? (
        <Layer x={PHONE.width * (1 - igP)}>
          <IgProductPage ctaPress={pressAmount(frame, t.ctaTap)} />
        </Layer>
      ) : null}
      {frame >= t.browserIn ? (
        <Layer y={PHONE.height * (1 - browser)}>
          <InAppBrowser progress={progress}>
            {frame < t.storeShown ? <BrowserSkeleton /> : null}
            {frame >= t.storeShown && frame < t.checkoutPush + 10 ? (
              <Layer x={PUSH_PARALLAX * checkoutP} dim={PUSH_DIM * checkoutP}>
                <StorePage buyPress={pressAmount(frame, t.buyTap)} />
              </Layer>
            ) : null}
            {frame >= t.checkoutPush && frame < t.successIn + 7 ? (
              <Layer x={PHONE.width * (1 - checkoutP) + PUSH_PARALLAX * successP}>
                <CheckoutPage scroll={scroll} rollStart={t.rollStart} payPress={pressAmount(frame, t.payTap)} />
              </Layer>
            ) : null}
            {frame >= t.successIn ? (
              <Layer x={PHONE.width * (1 - successP)}>
                <SuccessScreen drawStart={t.successIn} />
              </Layer>
            ) : null}
          </InAppBrowser>
        </Layer>
      ) : null}
      {/* A ripple ends with its screen, or it reads as a tap on whatever arrives next. */}
      {flow.taps.map((item) =>
        frame < item.until ? <TapRipple key={item.at} x={item.x} y={item.y} startFrame={item.at} color={item.color} /> : null,
      )}
      {frame >= t.notification && frame < t.notificationOut + 10 ? (
        <div
          style={{
            position: "absolute",
            left: NOTIFICATION.x,
            top: 0,
            transform: `translateY(${notificationY}px) scale(${0.96 + 0.04 * notificationIn})`,
          }}
        >
          <IosNotification />
        </div>
      ) : null}
    </>
  );
};

const barFor = (frame: number, flow: PhoneFlowData) => {
  const { t } = flow;
  const onReel = frame >= t.reelPush + PUSH_FRAMES / 2 && frame < t.igPush + PUSH_FRAMES / 2;
  return onReel ? ("light" as const) : ("dark" as const);
};

const PhoneBody: React.FC<{ flow: PhoneFlowData; shadow: boolean }> = ({ flow, shadow }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ width: OUTER.width, height: OUTER.height, flexShrink: 0 }}>
      <div
        style={{
          width: PHONE_OUTER.width,
          height: PHONE_OUTER.height,
          transform: `scale(${PHONE_SCALE})`,
          transformOrigin: "0 0",
        }}
      >
        <PhoneShell bar={barFor(frame, flow)} shadow={shadow}>
          <PhoneScreens flow={flow} />
        </PhoneShell>
      </div>
    </div>
  );
};

/** Cards around the phone in S9, in screen space. One at a time, three at most. */
const SIGNAL_SCALE = 1.7;
const Signals: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = (index: number) => spring({ frame: Math.max(0, frame - start - index * SIGNAL_STAGGER), fps, config: SHEET_SPRING });
  const shown = (index: number) => frame >= start + index * SIGNAL_STAGGER;
  const cardStyle = (index: number, left: number, top: number): React.CSSProperties => ({
    position: "absolute",
    left,
    top,
    transformOrigin: "0 0",
    opacity: pop(index),
    transform: `translateY(${(1 - pop(index)) * 26}px) scale(${SIGNAL_SCALE * (0.94 + 0.06 * pop(index))})`,
  });
  return (
    <AbsoluteFill>
      {shown(0) ? (
        <div style={cardStyle(0, 64, 610)}>
          <IosNotification style={{ width: 348 }} />
        </div>
      ) : null}
      {shown(1) ? (
        <div style={cardStyle(1, 600, 930)}>
          <FollowerToast />
        </div>
      ) : null}
      {shown(2) ? (
        <div style={cardStyle(2, 72, 1240)}>
          <DmBubble />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Everything from the dot growing into the phone to S9's pull-back: one phone, one camera. */
export const PhoneFlow: React.FC<{ flow: PhoneFlowData }> = ({ flow }) => {
  const frame = useCurrentFrame();
  const camera = cameraAt(flow.keyframes, frame);
  const phoneTop = FOCAL.y + (PHONE_WORLD.y - camera.y) * camera.s;
  // The headline's own band, only needed once a zoom carries the phone up under it.
  const band = interpolate(phoneTop, [370, 430], [1, 0], clamp);
  const shell = <PhoneBody flow={flow} shadow={false} />;
  const dot = { width: DOT_SIZE, height: DOT_SIZE, radius: DOT_SIZE / 2, background: COLORS.plum, shadow: 0 };
  const grown = { width: OUTER.width, height: OUTER.height, radius: OUTER.radius, background: "#050506", shadow: 1, content: shell };

  return (
    <>
      <AbsoluteFill style={{ backgroundColor: COLORS.mist }} />
      <MistBackground frameOffset={flow.s7Offset} />
      <Camera keyframes={flow.keyframes}>
        <World>
          <ExitText startFrame={0}>
            <WordBuild layout={flow.s7Sentence} startFrame={-60} />
          </ExitText>
          {frame < flow.t.morphEnd ? (
            <MorphBox
              x={AT.x}
              y={AT.y}
              steps={[
                { start: 0, end: 0, state: dot },
                { start: MORPH_START, end: flow.t.morphEnd, state: grown },
              ]}
            />
          ) : (
            <div style={{ position: "absolute", left: PHONE_WORLD.x, top: PHONE_WORLD.y }}>
              <PhoneBody flow={flow} shadow />
            </div>
          )}
        </World>
      </Camera>
      {band > 0 ? (
        <AbsoluteFill
          style={{
            opacity: band,
            background: `linear-gradient(180deg, ${COLORS.mist} 0, ${COLORS.mist} 412px, rgba(244,240,236,0) 500px)`,
          }}
        />
      ) : null}
      <Signals start={flow.t.signals} />
      {flow.headlines.map((line) => (
        <Headline key={line.check.id} line={line} />
      ))}
    </>
  );
};

