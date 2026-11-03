import { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { NightBackground } from "../Backgrounds";
import { Camera, fitCamera, type CameraKeyframe, World } from "../camera";
import type { SentenceCheck } from "../debug";
import { CAMERA_ZOOM, COLORS, FOCAL, MOTION, SHADOWS, TYPE } from "../tokens";
import { WordBuild, wordTiming } from "../WordBuild";
import { layoutSentence } from "../wordLayout";

/** A touch before the cut, so the beat never opens on an empty frame. */
const START_FRAME = -2;
/** The tightened word gap leaves 23 f; black beats are too short for the full 24. */
const BLACK_BEAT_MIN_HOLD = 21;

/** Short dark beat: laid out to fit at zoom 1, so the camera only drifts. */
export function useBlackBeat({
  id,
  lines,
  sceneStart,
  durationInFrames,
}: {
  id: string;
  lines: readonly string[];
  sceneStart: number;
  durationInFrames: number;
}) {
  return useMemo(() => {
    const layout = layoutSentence({ lines, style: TYPE.sentence, center: FOCAL });
    const center = fitCamera(layout.box, 1);
    const keyframes: CameraKeyframe[] = [
      { frame: 0, ...center },
      { frame: durationInFrames, ...center, s: CAMERA_ZOOM.drift, ease: "linear" },
    ];
    const { starts, settled } = wordTiming(layout, START_FRAME, MOTION.wordGapBlack);
    const check: SentenceCheck = {
      id,
      sceneStart,
      layout,
      keyframes,
      starts,
      holdStart: settled,
      holdEnd: durationInFrames,
      minHold: BLACK_BEAT_MIN_HOLD,
    };
    return { layout, keyframes, check };
  }, [durationInFrames, id, lines, sceneStart]);
}

export const BlackBeat: React.FC<{
  beat: ReturnType<typeof useBlackBeat>;
  /** First of the five flicker frames, local to the beat. */
  flickerFrom: number;
}> = ({ beat, flickerFrom }) => {
  const frame = useCurrentFrame();
  const flicker = [flickerFrom, flickerFrom + 1, flickerFrom + 2, flickerFrom + 3, flickerFrom + 4];

  return (
    <>
      <NightBackground />
      <Camera keyframes={beat.keyframes}>
        <World>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              opacity: interpolate(frame, flicker, [1, 0.35, 1, 0.6, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <WordBuild
              layout={beat.layout}
              startFrame={START_FRAME}
              gap={MOTION.wordGapBlack}
              color={COLORS.cream}
              textShadow={SHADOWS.creamGlow}
              accentTextShadow={SHADOWS.accentGlow}
            />
          </div>
        </World>
      </Camera>
    </>
  );
};
