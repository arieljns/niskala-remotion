import { useMemo } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MistBackground } from "../Backgrounds";
import { Camera, fitCamera, sentenceCamera, World, type CameraKeyframe } from "../camera";
import type { BoxCheck } from "../debug";
import { LebayWord, punchScale, squashScale, SQUASH_FRAMES } from "../LebayWord";
import { FLAT_LINE_CONTACT, FLAT_LINE_FRAMES, FlatLine, chartPath, pointsBounds, priceSeries, RisingLine } from "../lines";
import { Shake } from "../Shake";
import { CAMERA_ZOOM, COLORS, MOTION, TYPE } from "../tokens";
import { WordBuild, wordTiming } from "../WordBuild";
import { PhoneShell } from "../ui/ios/PhoneShell";
import { SEARCH_HERO_CARD, SEARCH_SINK, SearchResults } from "../ui/ios/SearchResults";
import { PHONE, PHONE_OUTER } from "../ui/ios/tokens";
import { layoutSentence, scaleBox, unionBox } from "../wordLayout";
import { timedCheck, type TimedCheck } from "./timedCheck";
import type { Reel01Copy } from "./copy";
import { CUE_LEAD, cueStart, voiceStarts, type SceneTiming } from "./timeline";

/**
 * S3-S5 share one world so the camera pans between them with no cut. S4 sits
 * above S3; S5 sits up and to the right of S4, along the rising line. The gaps
 * keep each area out of the others' framing. Frames are local to this Sequence,
 * which starts with S3.
 */
const S3_AT = { x: 502 };
const S4_AT = { x: 502, y: 1200 };
const S5_AT = { x: 1800, y: 900 };

/* S3 */
/** World pixels per phone point. */
const S3_PHONE_SCALE = 1.15;
const S3_PHONE = { width: PHONE_OUTER.width * S3_PHONE_SCALE, height: PHONE_OUTER.height * S3_PHONE_SCALE };
/** The block's centre: far enough below S4 that the phone never shows in S4's frame. */
const S3_CENTER_Y = 2970;
const S3_TEXT_GAP = 30;
/** The allowed push onto the hero card, so viewers clock it as theirs. */
const S3_PUSH_ZOOM = 1.15;
const S3_PULL_FRAMES = 16;
const S3_SINK_SPRING = { damping: 20, stiffness: 120, mass: 1 } as const;

/**
 * The VO leaves only the pads between scenes, so these run faster than v1's 21
 * and 18 f. The next sentence's first word starts just inside the pan, as in v1.
 */
const PAN_UP = 14;
const PAN_UP_WORD_LEAD = 10;
const PAN_RIGHT = 12;
const PAN_RIGHT_WORD_LEAD = 3;

/* S4 */
const CHART_CURVE = 3.2;
const CHART_FROM = { x: S4_AT.x - 468, y: S4_AT.y + 400 };
const CHART_TO = { x: S4_AT.x + 430, y: S4_AT.y - 420 };
// TODO_CHART_FIGURES: real values with a source go here. The chart carries no numbers until then.
/** Frames after the first word before the camera leaves it, so the rising line is seen, not just its end. */
const S4_TO_FIT_DELAY = 11;
/** Starts early so the word is near its peak on the cue: this is the one moment that has to hit exactly. */
const NAIK_BEFORE_CUE = 6;
const NAIK_PEAK_SCALE = 1.15;

/* S5 */
const S5_TEXT_LEFT = S5_AT.x - 300;
/** squashScale's snap into its tallest pose, which is what reads as the landing. */
const SQUASH_LANDS_AT = 8;
const FLAT_LINE_DELAY = 2;
const S5_FIT_FRAMES = MOTION.pullBack;

type ReasonsArgs = {
  s3: SceneTiming;
  s4: SceneTiming;
  copy: Pick<Reel01Copy, "promo" | "biaya"> & { omzet?: Reel01Copy["omzet"] };
};

/** A scene that sits later in the shared world: frames are local to the Sequence, which starts with S3. */
const shared = (s3: SceneTiming, scene: SceneTiming, from: number): SceneTiming => ({
  ...scene,
  from: s3.from,
  cues: scene.cues.map((cue) => cue + from),
  voEnd: scene.voEnd + from,
});

/**
 * S5 (omzet): the third area of the world. Optional: the flow preset has no S5 and its camera ends at S4.
 * Everything here is Reel01's S5 exactly as it was; only the place it is computed in moved.
 */
function buildS5({
  s3,
  s5,
  copy,
  s4Fit,
  end,
}: {
  s3: SceneTiming;
  s5: SceneTiming;
  copy: Reel01Copy["omzet"];
  s4Fit: ReturnType<typeof fitCamera>;
  end: number;
}) {
  const s5From = s5.from - s3.from;
  const omzet = layoutSentence({
    lines: copy.label,
    style: TYPE.sentence,
    topLeft: { x: S5_TEXT_LEFT, y: S5_AT.y - 300 },
  });
  const segitu = layoutSentence({
    lines: copy.squash,
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
    lines: copy.tail,
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
  const omzetStart = s5From + cueStart(s5, 0);
  const panRightEnd = omzetStart + PAN_RIGHT_WORD_LEAD;
  const panRightStart = panRightEnd - PAN_RIGHT;
  const omzetCamera = fitCamera(omzet.box, CAMERA_ZOOM.follow);
  const flatStart = omzetStart + FLAT_LINE_DELAY;
  const flatSettled = flatStart + FLAT_LINE_FRAMES;
  const segituLanding = s5From + s5.cues[1];
  const squashStart = segituLanding - SQUASH_LANDS_AT;
  // Framed before the squash starts: its widest pose is its first frame.
  const s5FitReady = squashStart;
  const s5FitStart = s5FitReady - S5_FIT_FRAMES;
  const ajaStart = Math.max(squashStart + SQUASH_FRAMES, s5From + voiceStarts(s5, [copy.times.tail[0]])[0]);
  const ajaSettled = ajaStart + MOTION.wordIn;

  const keyframes: CameraKeyframe[] = [
    { frame: panRightStart, ...s4Fit, ease: "linear" },
    { frame: panRightEnd, ...omzetCamera },
    { frame: s5FitStart, ...omzetCamera, ease: "linear" },
    { frame: s5FitReady, ...s5Fit },
  ];

  const s5Shared = shared(s3, s5, s5From);
  const sentenceChecks = (all: CameraKeyframe[]): TimedCheck[] => [
    timedCheck({
      id: "S5 Omzet?",
      scene: s5Shared,
      cue: s5Shared.cues[0],
      layout: omzet,
      keyframes: all,
      starts: [omzetStart],
      holdStart: s5FitReady,
      holdEnd: end,
    }),
    timedCheck({
      id: "S5 aja.",
      scene: s5Shared,
      cue: ajaStart + CUE_LEAD,
      layout: aja,
      keyframes: all,
      starts: [ajaStart],
      holdStart: ajaSettled,
      holdEnd: end,
    }),
  ];
  const boxChecks = (all: CameraKeyframe[]): BoxCheck[] => [
    {
      id: "S5 Segitu-segitu including overshoot",
      sceneStart: s3.from,
      keyframes: all,
      from: squashStart,
      to: end,
      boxAt: (frame) => {
        const scale = squashScale(frame - squashStart);
        return scaleBox(segitu.box, scale.x, scale.y);
      },
    },
    {
      id: "S5 flat line",
      sceneStart: s3.from,
      keyframes: all,
      from: flatSettled,
      to: end,
      boxAt: () => flatBounds,
    },
  ];

  return {
    panRightStart,
    keyframes,
    sentenceChecks,
    boxChecks,
    fields: { omzet, omzetStart, segitu, segituLanding, aja, flatD, flatBounds, flatStart, squashStart, ajaStart },
  };
}

function buildReasons({ s3, s4, s5, copy }: ReasonsArgs & { s5?: SceneTiming }) {
  const s4From = s4.from - s3.from;
  const durationInFrames = s5 ? s5.from - s3.from + s5.durationInFrames : s4From + s4.durationInFrames;

  /* ---------- S3 layout ---------- */
  // Laid out once to measure it, then placed: the headline stays over the phone, left-aligned to itself.
  const measured = layoutSentence({ lines: copy.promo.question, style: TYPE.sentence, center: { x: S3_AT.x, y: S3_CENTER_Y } });
  const textLeft = measured.box.x;
  const blockTop = S3_CENTER_Y - (measured.box.height * 2 + S3_TEXT_GAP + S3_PHONE.height) / 2;
  const textA = layoutSentence({ lines: copy.promo.question, style: TYPE.sentence, topLeft: { x: textLeft, y: blockTop } });
  const textB = layoutSentence({
    lines: copy.promo.answer,
    style: TYPE.sentence,
    topLeft: { x: textLeft, y: blockTop + textA.box.height },
  });
  const phone = {
    x: S3_AT.x - S3_PHONE.width / 2,
    y: blockTop + textA.box.height * 2 + S3_TEXT_GAP,
    ...S3_PHONE,
  };
  const heroCard = {
    x: phone.x + (PHONE.bezel + SEARCH_HERO_CARD.x) * S3_PHONE_SCALE,
    y: phone.y + (PHONE.bezel + SEARCH_HERO_CARD.y) * S3_PHONE_SCALE,
    width: SEARCH_HERO_CARD.width * S3_PHONE_SCALE,
    height: SEARCH_HERO_CARD.height * S3_PHONE_SCALE,
  };

  /* ---------- S3 timing and camera ---------- */
  const aGap = voiceStarts(s3, copy.promo.times.question);
  const textAStart = aGap[0];
  const textBStart = cueStart(s3, 1);
  const sinkStart = textBStart;
  const s3Wide = fitCamera(unionBox(textA.box, textB.box, phone));
  const s3Push = fitCamera(unionBox(textA.box, textB.box, heroCard), S3_PUSH_ZOOM);
  const s3PullEnd = textBStart + S3_PULL_FRAMES;
  const textASettled = wordTiming(textA, textAStart, aGap).settled;
  const textBSettled = wordTiming(textB, textBStart, MOTION.wordGap).settled;
  const bHoldCamera = s3Wide;

  /* ---------- S4 layout ---------- */
  const s4Text = layoutSentence({
    lines: copy.biaya.label,
    style: TYPE.sentence,
    topLeft: { x: CHART_FROM.x, y: S4_AT.y - 590 },
  });
  const naik = layoutSentence({
    lines: [copy.biaya.punch],
    style: TYPE.punch,
    topLeft: { x: CHART_FROM.x, y: s4Text.box.y + s4Text.box.height + 20 },
  });
  const terus = layoutSentence({
    lines: copy.biaya.tail,
    style: TYPE.sentence,
    topLeft: { x: CHART_FROM.x, y: naik.box.y + naik.box.height },
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
  const s4Fit = fitCamera(unionBox(s4Text.box, scaleBox(naik.box, NAIK_PEAK_SCALE), terus.box, lineBounds));

  /* ---------- S4 timing ---------- */
  const s4Start = s4From + cueStart(s4, 0);
  const naikCue = s4From + s4.cues[1];
  const naikStart = naikCue - NAIK_BEFORE_CUE;
  const terusStart = s4From + voiceStarts(s4, [copy.biaya.times.tail[0]])[0];
  const terusSettled = terusStart + MOTION.wordIn;
  const lineStart = s4From + s4.cues[0];
  const lineFrames = naikCue - lineStart;
  const lineEnd = naikCue;
  const panUpStart = s4Start - PAN_UP_WORD_LEAD;

  const s4Gap = voiceStarts(s4, copy.biaya.times.label).map((frame) => frame + s4From);
  const s4Camera = sentenceCamera({
    layout: s4Text,
    startFrame: s4Start,
    gap: s4Gap,
    enter: { from: bHoldCamera, frame: panUpStart, duration: PAN_UP },
    pullStart: s4Start + S4_TO_FIT_DELAY,
    target: s4Fit,
  });

  /* ---------- S5, when the preset has it ---------- */
  const end = durationInFrames;
  if (s5 && !copy.omzet) {
    throw new Error("S5 has a scene but the copy has no omzet");
  }
  const s5Part = s5 && copy.omzet ? buildS5({ s3, s5, copy: copy.omzet, s4Fit, end }) : null;
  /** Without S5 the camera stays on S4 until the scene ends. */
  const s4HoldEnd = s5Part ? s5Part.panRightStart : end;

  const keyframes: CameraKeyframe[] = [
    { frame: 0, ...s3Wide },
    { frame: textBStart, ...s3Push },
    { frame: s3PullEnd, ...s3Wide },
    { frame: panUpStart - 1, ...bHoldCamera, ease: "linear" },
    ...s4Camera.keyframes,
    ...(s5Part ? s5Part.keyframes : []),
  ];

  /* ---------- dev checks: frames here are local to the Sequence, so S4/S5 scenes shift by their offset ---------- */
  const s4Shared = shared(s3, s4, s4From);
  const sentenceChecks: TimedCheck[] = [
    timedCheck({
      id: "S3 Gak ikut promo?",
      scene: s3,
      cue: s3.cues[0],
      layout: textA,
      keyframes,
      starts: aGap,
      holdStart: textASettled,
      holdEnd: panUpStart,
    }),
    timedCheck({
      id: "S3 Tenggelam.",
      scene: s3,
      cue: s3.cues[1],
      layout: textB,
      keyframes,
      starts: wordTiming(textB, textBStart, MOTION.wordGap).starts,
      holdStart: textBSettled,
      holdEnd: panUpStart,
    }),
    timedCheck({
      id: "S4 Biaya iklan",
      scene: s4Shared,
      cue: s4Shared.cues[0],
      layout: s4Text,
      keyframes,
      starts: s4Camera.starts,
      holdStart: s4Camera.holdStart,
      holdEnd: s4HoldEnd,
    }),
    timedCheck({
      id: "S4 NAIK",
      scene: s4Shared,
      cue: naikCue,
      layout: naik,
      keyframes,
      starts: [naikStart],
      holdStart: naikStart + 14,
      holdEnd: s4HoldEnd,
    }),
    timedCheck({
      id: "S4 terus.",
      scene: s4Shared,
      cue: terusStart + CUE_LEAD,
      layout: terus,
      keyframes,
      starts: [terusStart],
      holdStart: terusSettled,
      holdEnd: s4HoldEnd,
    }),
    ...(s5Part ? s5Part.sentenceChecks(keyframes) : []),
  ];
  const boxChecks: BoxCheck[] = [
    {
      id: "S3 hero card on the push",
      sceneStart: s3.from,
      keyframes,
      from: textBStart,
      to: textBStart,
      boxAt: () => heroCard,
    },
    {
      id: "S3 headline + phone",
      sceneStart: s3.from,
      keyframes,
      from: s3PullEnd,
      to: panUpStart - 1,
      boxAt: () => unionBox(textA.box, textB.box, phone),
    },
    {
      id: "S4 NAIK including overshoot",
      sceneStart: s3.from,
      keyframes,
      from: lineEnd,
      to: s4HoldEnd,
      boxAt: (frame) => scaleBox(naik.box, punchScale(frame - naikStart)),
    },
    {
      id: "S4 line + sentence",
      sceneStart: s3.from,
      keyframes,
      from: lineEnd,
      to: s4HoldEnd,
      boxAt: () => unionBox(s4Text.box, naik.box, terus.box, lineBounds),
    },
    ...(s5Part ? s5Part.boxChecks(keyframes) : []),
  ];

  return {
    base: {
      durationInFrames,
      textA,
      textB,
      textAStart,
      aGap,
      textBStart,
      phone,
      sinkStart,
      panUpEnd: panUpStart + PAN_UP,
      s4Text,
      s4Start,
      s4Gap,
      naik,
      naikStart,
      naikCue,
      terus,
      terusStart,
      linePoints,
      lineBounds,
      lineStart,
      lineFrames,
      lineEnd,
      keyframes,
      sentenceChecks,
      boxChecks,
    },
    s5: s5Part ? s5Part.fields : null,
  };
}

type ReasonsBase = ReturnType<typeof buildReasons>["base"];
type ReasonsS5 = NonNullable<ReturnType<typeof buildReasons>["s5"]>;
/** What <Reasons> draws: S3 and S4 always, S5 (omzet) only when the preset has it. */
export type ReasonsLayout = ReasonsBase & Partial<ReasonsS5>;

/** Reel01 passes s5 and gets the whole world, as before. The flow preset leaves s5 out: S3 and S4 only. */
export function useReasons(args: ReasonsArgs & { s5: SceneTiming }): ReasonsBase & ReasonsS5;
export function useReasons(args: ReasonsArgs & { s5?: undefined }): ReasonsBase;
export function useReasons({ s3, s4, s5, copy }: ReasonsArgs & { s5?: SceneTiming }): ReasonsLayout {
  return useMemo(() => {
    const { base, s5: omzetPart } = buildReasons({ s3, s4, s5, copy });
    return omzetPart ? { ...base, ...omzetPart } : base;
  }, [copy, s3, s4, s5]);
}

/** The search screen. The list drops on "tenggelam", with a scroll's follow-through. */
const SearchPhone: React.FC<{ phone: { x: number; y: number }; sinkStart: number; until: number }> = ({ phone, sinkStart, until }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame >= until) {
    return null;
  }
  const sink = spring({ frame: Math.max(0, frame - sinkStart), fps, config: S3_SINK_SPRING });
  return (
    <div style={{ position: "absolute", left: phone.x, top: phone.y, width: S3_PHONE.width, height: S3_PHONE.height }}>
      <div style={{ width: PHONE_OUTER.width, height: PHONE_OUTER.height, transform: `scale(${S3_PHONE_SCALE})`, transformOrigin: "0 0" }}>
        <PhoneShell>
          <SearchResults drop={sink * SEARCH_SINK} />
        </PhoneShell>
      </div>
    </div>
  );
};

export const Reasons: React.FC<{ reasons: ReasonsLayout }> = ({ reasons }) => {
  return (
    <>
      {/* Same colour as Mist, so a shaking stage never shows an edge. */}
      <AbsoluteFill style={{ backgroundColor: COLORS.mist }} />
      <Shake at={reasons.flatStart === undefined ? [reasons.lineEnd] : [reasons.lineEnd, reasons.flatStart + FLAT_LINE_CONTACT]}>
        <MistBackground />
        <Camera keyframes={reasons.keyframes}>
          <World>
            {/* S3 */}
            <SearchPhone phone={reasons.phone} sinkStart={reasons.sinkStart} until={reasons.panUpEnd} />
            <WordBuild layout={reasons.textA} startFrame={reasons.textAStart} gap={reasons.aGap} />
            <WordBuild layout={reasons.textB} startFrame={reasons.textBStart} />

            {/* S4 */}
            <RisingLine
              points={reasons.linePoints}
              bounds={reasons.lineBounds}
              startFrame={reasons.lineStart}
              durationInFrames={reasons.lineFrames}
            />
            <WordBuild layout={reasons.s4Text} startFrame={reasons.s4Start} gap={reasons.s4Gap} />
            <LebayWord layout={reasons.naik} preset="punch" startFrame={reasons.naikStart} />
            <WordBuild layout={reasons.terus} startFrame={reasons.terusStart} />

            {/* S5, only when the preset has it */}
            {reasons.omzet && reasons.omzetStart !== undefined ? (
              <WordBuild layout={reasons.omzet} startFrame={reasons.omzetStart} />
            ) : null}
            {reasons.flatD !== undefined && reasons.flatBounds && reasons.flatStart !== undefined ? (
              <FlatLine d={reasons.flatD} bounds={reasons.flatBounds} startFrame={reasons.flatStart} />
            ) : null}
            {reasons.segitu && reasons.squashStart !== undefined ? (
              <LebayWord layout={reasons.segitu} preset="squash" startFrame={reasons.squashStart} />
            ) : null}
            {reasons.aja && reasons.ajaStart !== undefined ? (
              <WordBuild layout={reasons.aja} startFrame={reasons.ajaStart} />
            ) : null}
          </World>
        </Camera>
      </Shake>
    </>
  );
};
