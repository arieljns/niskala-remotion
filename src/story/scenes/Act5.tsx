import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { storyFlat } from "../../assets";
import { CLIENT, CLIENT_FONTS } from "../../theme/client";
import { FONTS } from "../../theme/fonts";
import { SENJA } from "../../theme/senja";
import { easedInterpolate, EASE } from "../../theme/motion";
import { useLayout } from "../../useLayout";
import { Caption } from "../components/Caption";
import { ContohChip } from "../components/ContohChip";
import { Highlight, type HotspotRect } from "../components/Highlight";
import { LAPTOP_OUTER, LAPTOP_SCREEN, LAPTOP_SCREEN_ORIGIN, LaptopFrame } from "../components/LaptopFrame";
import { PngSlice } from "../components/PngSlice";
import { BRAND_TAGLINE, CTA_TEXT, NISKALA_WA_DISPLAY } from "../constants";
import { BrandLogo, CtaPill } from "../senja/Chrome";
import { StickerTag } from "../senja/StickerTag";
import { Surface } from "../senja/Surface";
import { settledTilt } from "../senja/tilt";
import { Vault } from "../senja/Vault";
import type { SceneComponent } from "./index";

/* ------------------------------------------------------------------------ */
/* 5a — growth on Sunset: the six monthly bars on 15 grow one after another, */
/* and the Oktober counter climbs with them, Rp3,2 jt → Rp21,3 jt.           */
/* ------------------------------------------------------------------------ */

/**
 * flat/15-revenue-growth.png "Pendapatan bulanan" chart, in screen points
 * (PNG px / 2). 12 pt per jt above the baseline; each bar is light (new
 * buyers) on top of dark (returning buyers). Value labels sit 4–24 pt above
 * each bar top.
 */
const CHART_15 = {
  baseline: 542,
  barWidth: 52.5,
  /** Covers the bars and their labels; gridlines inside it are redrawn. */
  cover: { x: 340, y: 258, width: 482, height: 284 },
  gridYs: [301.5, 361.5, 421.5, 481.5],
  bars: [
    { x: 348, top: 503.5, split: 535, value: 3.2 },
    { x: 431, top: 472.5, split: 525.5, value: 5.8 },
    { x: 513.5, top: 435, split: 509, value: 8.9 },
    { x: 596, top: 393, split: 487, value: 12.4 },
    { x: 679, top: 341.5, split: 460, value: 16.7 },
    { x: 761.5, top: 286, split: 424.5, value: 21.3 },
  ],
  colors: { light: "#EAD9C6", dark: "#C9846A", lightNow: "#F4B08F", darkNow: CLIENT.accent, grid: "#EFE8DC" },
} as const;

/** "Rp21,3 jt" in the dark Pendapatan Oktober card, and the card itself. */
const COUNTER_15 = { x: 896, y: 190, width: 166, height: 57 };
const OKTOBER_CARD_15: HotspotRect = { x: 878, y: 147, width: 300, height: 143, radius: 18 };

const BARS_START = 22;
const BAR_STAGGER = 12;
const BAR_GROW = 20;
const barEnd = (i: number) => BARS_START + i * BAR_STAGGER + BAR_GROW;
const LANDED_AT = barEnd(5);

const formatJt = (value: number) => `Rp${value.toFixed(1).replace(".", ",")} jt`;

const GrowingBar: React.FC<{ src: string; index: number }> = ({ src, index }) => {
  const frame = useCurrentFrame();
  const bar = CHART_15.bars[index];
  const now = index === CHART_15.bars.length - 1;
  const start = BARS_START + index * BAR_STAGGER;
  const grow = easedInterpolate(frame, [start, start + BAR_GROW], [0, 1]);
  const fullHeight = CHART_15.baseline - bar.top;
  const height = fullHeight * grow;
  const darkShare = (CHART_15.baseline - bar.split) / fullHeight;
  const labelIn = easedInterpolate(frame, [start + BAR_GROW - 6, start + BAR_GROW + 4], [0, 1]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: bar.x,
          top: CHART_15.baseline - height,
          width: CHART_15.barWidth,
          height,
          borderRadius: "6px 6px 0 0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: now ? CHART_15.colors.lightNow : CHART_15.colors.light,
        }}
      >
        <div style={{ marginTop: "auto", height: `${darkShare * 100}%`, backgroundColor: now ? CHART_15.colors.darkNow : CHART_15.colors.dark }} />
      </div>
      {/* The bar's value label, cut from the PNG, rides the bar top. */}
      <PngSlice
        src={src}
        imageWidth={LAPTOP_SCREEN.width}
        imageHeight={LAPTOP_SCREEN.height}
        x={bar.x - 9}
        y={bar.top - 24}
        width={CHART_15.barWidth + 18}
        height={20}
        style={{
          left: bar.x - 9,
          top: CHART_15.baseline - height - 24,
          opacity: labelIn,
        }}
      />
    </>
  );
};

/** Paints out the PNG's bars and counter, then rebuilds both. Screen coordinates. */
const GrowthChart: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  // The counter follows the most recent bar: Mei's value until it lands, then each month in turn.
  const value = interpolate(
    frame,
    CHART_15.bars.map((_, i) => barEnd(i)),
    CHART_15.bars.map((b) => b.value),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE },
  );

  return (
    <>
      <div style={{ position: "absolute", ...rect(CHART_15.cover), backgroundColor: CLIENT.white }} />
      {CHART_15.gridYs.map((y) => (
        <div key={y} style={{ position: "absolute", left: CHART_15.cover.x, top: y, width: CHART_15.cover.width, height: 1, backgroundColor: CHART_15.colors.grid }} />
      ))}
      {CHART_15.bars.map((bar, i) => (
        <GrowingBar key={bar.x} src={src} index={i} />
      ))}

      {/* Counter: the card's ink with its glow redrawn on top (peak sampled at
          screen 1130,186 and falling to ink ~105 pt out), so the patch is invisible. */}
      <div
        style={{
          position: "absolute",
          ...rect(COUNTER_15),
          background: `radial-gradient(circle at ${1130 - COUNTER_15.x}px ${186 - COUNTER_15.y}px, #883D25 0, #683523 45px, #4C2E21 75px, ${CLIENT.ink} 105px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: COUNTER_15.x + 4,
          top: COUNTER_15.y + 4,
          fontFamily: CLIENT_FONTS.ui,
          fontWeight: 700,
          fontSize: 46,
          lineHeight: 1,
          letterSpacing: "-0.035em",
          color: CLIENT.white,
          whiteSpace: "nowrap",
        }}
      >
        {formatJt(value)}
      </div>
    </>
  );
};

const rect = (r: { x: number; y: number; width: number; height: number }) => ({ left: r.x, top: r.y, width: r.width, height: r.height });

/** Screen point the 9:16 push centres on: between the chart and the Oktober card. */
const PUSH_FOCUS = { x: 700, y: 330 };

const Scene5a: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const { width: W, height: H, isPortrait } = layout;
  const src = storyFlat("15-revenue-growth");
  const laptopW = isPortrait ? W * 0.94 : W * 0.54;
  const scale = laptopW / LAPTOP_OUTER.width;
  const center = isPortrait ? W * 0.5 : W * 0.71;
  const top = isPortrait ? H * 0.43 : H * 0.27;
  const rise = easedInterpolate(frame, [0, 24], [1, 0]);
  // 16:9 holds the whole laptop with a slow push; 9:16 pushes in on the chart so the bars read.
  const push = easedInterpolate(frame, [0, scene.durationInFrames], isPortrait ? [1, 1.32] : [1, 1.06]);
  const origin = {
    x: (LAPTOP_SCREEN_ORIGIN.x + PUSH_FOCUS.x) * scale,
    y: (LAPTOP_SCREEN_ORIGIN.y + PUSH_FOCUS.y) * scale,
  };

  return (
    <Surface kind="sunset" glowFrom={24}>
      <Vault centerX={center} top={isPortrait ? H * 0.5 : H * 0.36} width={isPortrait ? W * 0.88 : W * 0.44} fill="glass" />
      <div
        style={{
          position: "absolute",
          left: center - laptopW / 2,
          top,
          opacity: 1 - rise,
          transform: `translateY(${rise * 30}px) scale(${push})`,
          transformOrigin: `${origin.x}px ${origin.y}px`,
        }}
      >
        <LaptopFrame src={src} width={laptopW} tilt={settledTilt(frame, LANDED_AT, isPortrait ? 0 : 4, layout, 40)}>
          <GrowthChart src={src} />
          <Highlight rect={OKTOBER_CARD_15} startFrame={LANDED_AT + 4} />
        </LaptopFrame>
      </div>

      {/* Sunset keeps every Niskala-layer label in the top/left 60%: the chip
          sits under the caption, not pinned to the laptop's right edge. */}
      <ContohChip style={{ position: "absolute", left: W * (isPortrait ? 0.07 : 0.06), top: H * (isPortrait ? 0.34 : 0.56) }} />
      <StickerTag
        text="6,6x"
        x={isPortrait ? W * 0.56 : W * 0.47}
        y={isPortrait ? H * 0.335 : H * 0.17}
        rotate={-5}
        startFrame={LANDED_AT + 8}
      />
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

/* ------------------------------------------------------------------------ */
/* 5b — end card on Night, one centred stack: the Niskala logo + tagline,    */
/* the headline, then the cream WhatsApp pill with the number.               */
/* ------------------------------------------------------------------------ */

const Scene5b: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const { width: W, isPortrait } = layout;
  const logoSize = isPortrait ? 84 : 76;
  const logoIn = easedInterpolate(frame, [0, 22], [0, 1]);
  const taglineIn = easedInterpolate(frame, [14, 32], [0, 1]);
  const ctaIn = easedInterpolate(frame, [46, 62], [0, 1]);
  const rise = (t: number) => ({ opacity: t, transform: `translateY(${(1 - t) * 16}px)` });

  return (
    <Surface kind="night" glowFrom={10}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", zIndex: 60 }}>
        <div style={{ width: W * (isPortrait ? 0.86 : 0.8), display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ opacity: logoIn, transform: `translateY(${(1 - logoIn) * 24}px) scale(${0.92 + 0.08 * logoIn})` }}>
            <BrandLogo size={logoSize} />
          </div>
          {/* Tagline in Lexend 300: a quiet sign-off under the mark, no accent. */}
          <div
            style={{
              marginTop: logoSize * 0.4,
              fontFamily: FONTS.body,
              fontWeight: 300,
              fontSize: isPortrait ? 36 : 32,
              lineHeight: 1.35,
              textAlign: "center",
              color: SENJA.cream100,
              ...rise(taglineIn * 0.9),
            }}
          >
            {BRAND_TAGLINE}
          </div>
          <div style={{ marginTop: isPortrait ? 96 : 64 }}>
            <Caption text={scene.caption} startFrame={24} centered />
          </div>
          <div style={{ marginTop: isPortrait ? 80 : 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, ...rise(ctaIn) }}>
            <CtaPill label={CTA_TEXT} scale={isPortrait ? 1.1 : 1} />
            {/* The number in plain cream Lexend: small text, so no gradient. */}
            <div style={{ fontFamily: FONTS.body, fontWeight: 500, fontSize: isPortrait ? 40 : 34, letterSpacing: "0.02em", color: SENJA.cream100 }}>
              {NISKALA_WA_DISPLAY}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </Surface>
  );
};

export const ACT5_SCENES = { "5a": Scene5a, "5b": Scene5b };
