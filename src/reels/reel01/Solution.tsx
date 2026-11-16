import { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { MistBackground } from "../Backgrounds";
import { Camera, fitCamera, sentenceCamera, World, type CameraKeyframe } from "../camera";
import type { BoxCheck } from "../debug";
import { ExitText } from "../ExitText";
import { COLORS, EASINGS, TYPE } from "../tokens";
import { WordBuild } from "../WordBuild";
import { layoutSentence } from "../wordLayout";
import { timedCheck, type TimedCheck } from "./timedCheck";
import type { Reel01Copy } from "./copy";
import { CAMERA_SETTLE, fitToHold, PHRASE_HANDOVER, voiceStarts, type SceneTiming } from "./timeline";

/** S7. The dot under the sentence is where S7b's phone grows from. */
export const AT = { x: 502, y: 900 };
export const DOT_SIZE = 28;
const DOT_FRAMES = 10;
/** Pops as the VO finishes, and stays through the pad. */
const DOT_BEFORE_VO_END = 8;
const HANDOVER = 14;

export function useSolution(scene: SceneTiming, copy: Reel01Copy["solution"]) {
  return useMemo(() => {
    const textA = layoutSentence({
      lines: copy.first,
      style: TYPE.sentence,
      center: { x: AT.x, y: AT.y - 140 },
    });
    const textB = layoutSentence({
      lines: copy.second,
      style: TYPE.sentence,
      center: { x: AT.x, y: AT.y - 190 },
    });

    const bGap = fitToHold(voiceStarts(scene, copy.times.second), scene.durationInFrames, CAMERA_SETTLE);
    const bStart = bGap[0];
    const aOut = bStart - PHRASE_HANDOVER;
    const aGap = fitToHold(voiceStarts(scene, copy.times.first), aOut, CAMERA_SETTLE);
    const aStart = aGap[0];
    const dotPop = scene.voEnd - DOT_BEFORE_VO_END;

    const aCamera = sentenceCamera({ layout: textA, startFrame: aStart, gap: aGap });
    const bCamera = sentenceCamera({
      layout: textB,
      startFrame: bStart,
      gap: bGap,
      enter: { from: fitCamera(textA.box), frame: aOut, duration: HANDOVER },
    });
    const keyframes: CameraKeyframe[] = [
      ...aCamera.keyframes,
      { frame: aOut - 1, ...fitCamera(textA.box), ease: "linear" },
      ...bCamera.keyframes,
    ];

    const sentenceChecks: TimedCheck[] = [
      timedCheck({
        id: "S7 Tapi bukan berarti kamu harus tutup toko.",
        scene,
        cue: scene.cues[0],
        layout: textA,
        keyframes,
        starts: aCamera.starts,
        holdStart: aCamera.holdStart,
        holdEnd: aOut,
      }),
      timedCheck({
        id: "S7 Cukup buka jalur jualan sendiri.",
        scene,
        cue: scene.cues[1],
        layout: textB,
        keyframes,
        starts: bCamera.starts,
        holdStart: bCamera.holdStart,
        holdEnd: scene.durationInFrames,
      }),
    ];
    const boxChecks: BoxCheck[] = [
      {
        id: "S7 dot",
        sceneStart: scene.from,
        keyframes,
        from: dotPop,
        to: scene.durationInFrames,
        boxAt: () => ({ x: AT.x - DOT_SIZE / 2, y: AT.y - DOT_SIZE / 2, width: DOT_SIZE, height: DOT_SIZE }),
      },
    ];

    return { textA, textB, aStart, aOut, aGap, bStart, bGap, dotPop, keyframes, sentenceChecks, boxChecks };
  }, [copy, scene]);
}

export const Solution: React.FC<{ solution: ReturnType<typeof useSolution> }> = ({ solution }) => {
  const frame = useCurrentFrame();
  const dotScale = interpolate(frame, [solution.dotPop, solution.dotPop + DOT_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASINGS.pop,
  });

  return (
    <>
      <AbsoluteFill style={{ backgroundColor: COLORS.mist }} />
      <MistBackground />
      <Camera keyframes={solution.keyframes}>
        <World>
          <ExitText startFrame={solution.aOut}>
            <WordBuild layout={solution.textA} startFrame={solution.aStart} gap={solution.aGap} />
          </ExitText>
          <WordBuild layout={solution.textB} startFrame={solution.bStart} gap={solution.bGap} />
          <div
            style={{
              position: "absolute",
              left: AT.x - DOT_SIZE / 2,
              top: AT.y - DOT_SIZE / 2,
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: DOT_SIZE / 2,
              backgroundColor: COLORS.plum,
              scale: String(dotScale),
            }}
          />
        </World>
      </Camera>
    </>
  );
};
