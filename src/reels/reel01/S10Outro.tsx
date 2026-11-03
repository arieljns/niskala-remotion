import { useMemo } from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { findAsset } from "../AssetSlot";
import { NightBackground } from "../Backgrounds";
import { Camera, fitCamera, World, type CameraKeyframe } from "../camera";
import type { SentenceCheck } from "../debug";
import { ExitText } from "../ExitText";
import { CAMERA_ZOOM, COLORS, EASINGS, FOCAL, MOTION, SHADOWS, TYPE } from "../tokens";
import { WordBuild, wordTiming } from "../WordBuild";
import { layoutSentence } from "../wordLayout";
import { SCENES } from "./timeline";

const START_FRAME = -2;
const TEXT_OUT = 46;
const NAME_START = TEXT_OUT + MOTION.out;
const NAME_FRAMES = 15;
const LOGO_SIZE = 160;

/** On Night, so it drifts like a black beat; the hold reaches its target without a pull-back. */
export function useS10Outro() {
  return useMemo(() => {
    const layout = layoutSentence({
      lines: ["**Follow** ~~dulu.~~", "__Tipsnya__ ~~kita bagiin.~~"],
      style: TYPE.sentence,
      center: FOCAL,
    });
    const name = layoutSentence({ lines: ["Niskala Works"], style: TYPE.outro, center: FOCAL });
    const { durationInFrames } = SCENES.s10;
    const center = fitCamera(layout.box, 1);
    const keyframes: CameraKeyframe[] = [
      { frame: 0, ...center },
      { frame: durationInFrames, ...center, s: CAMERA_ZOOM.drift, ease: "linear" },
    ];
    const { starts, settled } = wordTiming(layout, START_FRAME, MOTION.wordGapBlack);
    const check: SentenceCheck = {
      id: "S10 text",
      sceneStart: SCENES.s10.from,
      layout,
      keyframes,
      starts,
      holdStart: settled,
      holdEnd: TEXT_OUT,
    };
    const nameCheck: SentenceCheck = {
      id: "S10 Niskala Works",
      sceneStart: SCENES.s10.from,
      layout: name,
      keyframes,
      starts: [NAME_START],
      holdStart: NAME_START + NAME_FRAMES,
      holdEnd: durationInFrames,
      minHold: 17,
    };
    return { layout, name, keyframes, checks: [check, nameCheck] };
  }, []);
}

export const S10Outro: React.FC<{ outro: ReturnType<typeof useS10Outro> }> = ({ outro }) => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASINGS.brand } as const;
  const end = NAME_START + NAME_FRAMES;
  const blur = interpolate(frame, [NAME_START, end], [16, 0], clamp);
  const logo = findAsset("TODO_LOGO");
  const { box, words, style } = outro.name;

  return (
    <>
      <NightBackground />
      <Camera keyframes={outro.keyframes}>
        <World>
          <ExitText startFrame={TEXT_OUT}>
            <WordBuild
              layout={outro.layout}
              startFrame={START_FRAME}
              gap={MOTION.wordGapBlack}
              color={COLORS.cream}
              textShadow={SHADOWS.creamGlow}
              accentTextShadow={SHADOWS.accentGlow}
            />
          </ExitText>
          {frame >= NAME_START ? (
            <div
              style={{
                position: "absolute",
                left: box.x,
                top: box.y,
                whiteSpace: "pre",
                fontFamily: style.fontFamily,
                fontStretch: style.fontStretch,
                fontWeight: style.fontWeight,
                fontSize: style.fontSize,
                letterSpacing: style.letterSpacing,
                lineHeight: `${box.height}px`,
                color: COLORS.cream,
                textShadow: SHADOWS.creamGlow,
                opacity: interpolate(frame, [NAME_START, end], [0, 1], clamp),
                filter: blur > 0 ? `blur(${blur}px)` : undefined,
              }}
            >
              {/* Optional logo: appears only once TODO_LOGO is delivered. */}
              {logo ? (
                <Img
                  src={staticFile(logo)}
                  style={{
                    position: "absolute",
                    left: (box.width - LOGO_SIZE) / 2,
                    top: -LOGO_SIZE - 32,
                    width: LOGO_SIZE,
                    height: LOGO_SIZE,
                    objectFit: "contain",
                  }}
                />
              ) : null}
              {words[0].text} {words[1].text}
            </div>
          ) : null}
        </World>
      </Camera>
    </>
  );
};
