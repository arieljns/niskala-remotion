import { Composition, Folder } from "remotion";
import { ActComposition } from "./Act";
import { ACTS, getActDuration, STORY_FPS } from "./timeline";

/**
 * One composition per act (e.g. Act1Bridge, Act1Bridge-Vertical) so each act
 * can be previewed and reviewed on its own, in both aspect ratios.
 */
export const StoryActCompositions: React.FC = () => (
  <Folder name="StoryActs">
    {ACTS.flatMap((act) =>
      [
        { suffix: "", width: 1920, height: 1080 },
        { suffix: "-Vertical", width: 1080, height: 1920 },
      ].map((canvas) => (
        <Composition
          key={act.compositionId + canvas.suffix}
          id={act.compositionId + canvas.suffix}
          component={ActComposition}
          defaultProps={{ actId: act.id }}
          durationInFrames={getActDuration(act)}
          fps={STORY_FPS}
          width={canvas.width}
          height={canvas.height}
        />
      )),
    )}
  </Folder>
);
