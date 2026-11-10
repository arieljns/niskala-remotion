import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { SENJA } from "../theme/senja";
import { SceneSlate } from "./SceneSlate";
import { SCENE_COMPONENTS } from "./scenes";
import { getAct, SCENE_TRANSITION_FRAMES, type ActSpec } from "./timeline";
import { easedTiming, slideFade } from "./transitions";

/**
 * Plays one act's scenes back to back: slide + fade between scenes, or a hard
 * cut where the timeline marks `enter: "cut"`. Used both as a standalone act
 * composition and as one segment of the assembled NiskalaStory.
 */
export const Act: React.FC<{ act: ActSpec }> = ({ act }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: SENJA.paper50 }}>
      <TransitionSeries>
        {act.scenes.flatMap((scene, i) => {
          const Scene = SCENE_COMPONENTS[scene.id];
          const sequence = (
            <TransitionSeries.Sequence key={scene.id} name={`${scene.id} ${scene.name}`} durationInFrames={scene.durationInFrames}>
              {Scene ? <Scene scene={scene} /> : <SceneSlate act={act} scene={scene} />}
            </TransitionSeries.Sequence>
          );
          if (i === 0 || scene.enter === "cut") return [sequence];
          return [
            <TransitionSeries.Transition
              key={`${scene.id}-in`}
              presentation={slideFade()}
              timing={easedTiming(SCENE_TRANSITION_FRAMES)}
            />,
            sequence,
          ];
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

/** Composition component for previewing a single act on its own. */
export const ActComposition: React.FC<{ actId: ActSpec["id"] }> = ({ actId }) => <Act act={getAct(actId)} />;
