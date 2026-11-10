import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { SENJA } from "../theme/senja";
import { Act } from "./Act";
import { MUSIC_TRACK } from "./constants";
import { ACT_TRANSITION_FRAMES, getActDuration, getActs } from "./timeline";
import { easedTiming, slideFade } from "./transitions";

export type NiskalaStoryProps = {
  showPainIntro: boolean;
};

export const NiskalaStory: React.FC<NiskalaStoryProps> = ({ showPainIntro }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: SENJA.paper50 }}>
      <TransitionSeries>
        {getActs(showPainIntro).flatMap((act, i) => {
          const sequence = (
            <TransitionSeries.Sequence key={act.id} name={act.title} durationInFrames={getActDuration(act)}>
              <Act act={act} />
            </TransitionSeries.Sequence>
          );
          if (i === 0) return [sequence];
          return [
            <TransitionSeries.Transition
              key={`${act.id}-in`}
              presentation={slideFade()}
              timing={easedTiming(ACT_TRANSITION_FRAMES)}
            />,
            sequence,
          ];
        })}
      </TransitionSeries>
      {MUSIC_TRACK ? <Audio src={staticFile(MUSIC_TRACK)} /> : null}
    </AbsoluteFill>
  );
};
