import { ExitText } from "../ExitText";
import { fitCamera, type CameraKeyframe } from "../camera";
import { FOCAL, TYPE } from "../tokens";
import { WordBuild, wordTiming } from "../WordBuild";
import { layoutSentence } from "../wordLayout";
import { timedCheck, type TimedCheck } from "./timedCheck";
import { CUE_LEAD, fitToHold, PHRASE_HANDOVER, voiceStarts, type SceneTiming } from "./timeline";

/** Where the headline block sits, above the phone (top of the safe zone). */
export const HEADLINE_CENTER = { x: FOCAL.x, y: 315 } as const;

/** Pinned to the screen, so the check sees a camera that never moves. */
const PINNED: CameraKeyframe[] = [{ frame: 0, ...fitCamera({ x: FOCAL.x, y: FOCAL.y, width: 0, height: 0 }, 1) }];

export type HeadlineSpec = {
  scene: SceneTiming;
  /** Where this scene starts in the frames of the Sequence rendering the headlines. */
  offset: number;
  lines: readonly string[];
  /** Each word's start, in seconds from the start of the VO file. */
  at: readonly number[];
  center?: { x: number; y: number };
};

export type BuiltHeadline = ReturnType<typeof buildHeadlines>[number];

/**
 * Each line starts on its cue and leaves just before the next one starts,
 * including across scenes. The last line stays until the Sequence ends.
 */
export function buildHeadlines(specs: readonly HeadlineSpec[]) {
  const startOf = (spec: HeadlineSpec) => spec.offset + voiceStarts(spec.scene, spec.at)[0];
  return specs.map((spec, index) => {
    const layout = layoutSentence({ lines: spec.lines, style: TYPE.sentence, center: spec.center ?? HEADLINE_CENTER });
    if (layout.words.length !== spec.at.length) {
      throw new Error(`${spec.scene.id}: ${layout.words.length} words but ${spec.at.length} word times`);
    }
    const start = startOf(spec);
    const next = specs[index + 1];
    const out = next ? startOf(next) - PHRASE_HANDOVER : null;
    const localOut = out === null ? spec.scene.durationInFrames : out - spec.offset;
    const localStarts = fitToHold(voiceStarts(spec.scene, spec.at), localOut);
    const { starts, settled } = wordTiming(layout, localStarts[0], localStarts);
    const check: TimedCheck = timedCheck({
      id: `${spec.scene.id} ${layout.words.map((word) => word.text).join(" ")}`,
      scene: spec.scene,
      cue: localStarts[0] + CUE_LEAD,
      layout,
      keyframes: PINNED,
      starts,
      holdStart: settled,
      holdEnd: localOut,
    });
    return { layout, start, starts: localStarts.map((frame) => frame + spec.offset), out, check };
  });
}

export const Headline: React.FC<{
  line: BuiltHeadline;
  color?: string;
  textShadow?: string;
  accentTextShadow?: string;
}> = ({ line, color, textShadow, accentTextShadow }) => {
  const words = (
    <WordBuild
      layout={line.layout}
      startFrame={line.start}
      gap={line.starts}
      color={color}
      textShadow={textShadow}
      accentTextShadow={accentTextShadow}
    />
  );
  return line.out === null ? <div>{words}</div> : <ExitText startFrame={line.out}>{words}</ExitText>;
};
