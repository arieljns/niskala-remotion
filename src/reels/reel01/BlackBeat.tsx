import { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { NightBackground } from "../Backgrounds";
import { Camera, fitCamera, type CameraKeyframe, World } from "../camera";
import { ExitText } from "../ExitText";
import { CAMERA_ZOOM, COLORS, FOCAL, SHADOWS, TYPE } from "../tokens";
import { WordBuild, wordTiming } from "../WordBuild";
import { layoutSentence } from "../wordLayout";
import { timedCheck } from "./timedCheck";
import { CUE_LEAD, fitToHold, PHRASE_HANDOVER, voiceStarts, type SceneTiming } from "./timeline";

/** Short dark beat: laid out to fit at zoom 1, so the camera only drifts. Each phrase hands over to the next. */
export function useBlackBeat({
  id,
  phrases,
  scene,
}: {
  id: string;
  phrases: readonly { lines: readonly string[]; at: readonly number[] }[];
  scene: SceneTiming;
}) {
  return useMemo(() => {
    const layouts = phrases.map((phrase) => layoutSentence({ lines: phrase.lines, style: TYPE.sentence, center: FOCAL }));
    const center = fitCamera(layouts[layouts.length - 1].box, 1);
    const keyframes: CameraKeyframe[] = [
      { frame: 0, ...center },
      { frame: scene.durationInFrames, ...center, s: CAMERA_ZOOM.drift, ease: "linear" },
    ];
    const built = phrases.map((phrase, index) => {
      const layout = layouts[index];
      if (layout.words.length !== phrase.at.length) {
        throw new Error(`${id}: ${layout.words.length} words but ${phrase.at.length} word times`);
      }
      const next = phrases[index + 1];
      const out = next ? voiceStarts(scene, next.at)[0] - PHRASE_HANDOVER : null;
      const starts = fitToHold(voiceStarts(scene, phrase.at), out ?? scene.durationInFrames);
      const { settled } = wordTiming(layout, starts[0], starts);
      const check = timedCheck({
        id: phrases.length > 1 ? `${id} ${index + 1}` : id,
        scene,
        cue: starts[0] + CUE_LEAD,
        layout,
        keyframes,
        starts,
        holdStart: settled,
        holdEnd: out ?? scene.durationInFrames,
      });
      return { layout, starts, settled, out, check };
    });
    return { keyframes, built, checks: built.map((item) => item.check), settled: built[built.length - 1].settled };
  }, [id, phrases, scene]);
}

export const BlackBeat: React.FC<{
  beat: ReturnType<typeof useBlackBeat>;
  /** First of the five flicker frames, counted from the last word settling (as in v1). */
  flickerAfterSettled: number;
}> = ({ beat, flickerAfterSettled }) => {
  const frame = useCurrentFrame();
  const flickerFrom = beat.settled + flickerAfterSettled;
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
            {beat.built.map((item) => {
              const words = (
                <WordBuild
                  layout={item.layout}
                  startFrame={item.starts[0]}
                  gap={item.starts}
                  color={COLORS.cream}
                  textShadow={SHADOWS.creamGlow}
                  accentTextShadow={SHADOWS.accentGlow}
                />
              );
              return item.out === null ? (
                <div key={item.check.id}>{words}</div>
              ) : (
                <ExitText key={item.check.id} startFrame={item.out}>
                  {words}
                </ExitText>
              );
            })}
          </div>
        </World>
      </Camera>
    </>
  );
};
