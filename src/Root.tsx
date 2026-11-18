import "./index.css";
import { useEffect, useState } from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { waitForStoryFonts } from "./theme/fonts";
import { calculateReel01Metadata } from "./reels/reel01/audio";
import { UiKitShowcase } from "./reels/reel01/dev/UiKitShowcase";
import { Reel01, REEL01_DEFAULT_PROPS } from "./reels/reel01/Reel01";
import { Reel02, REEL02_DEFAULT_PROPS, REEL02_FRAMES } from "./reels/reel02/Reel02";
import { Reel03, REEL03_DEFAULT_PROPS, REEL03_FRAMES } from "./reels/reel03/Reel03";
import { buildTimeline } from "./reels/reel01/timeline";
import { REEL } from "./reels/tokens";

/** Registers every Reels composition. Holds the render until fonts load. */
export const RemotionRoot: React.FC = () => {
  const [handle] = useState(() => delayRender("Waiting for reel fonts to load"));

  useEffect(() => {
    waitForStoryFonts()
      .then(() => continueRender(handle))
      .catch((err) => {
        throw err;
      });
  }, [handle]);

  return (
    <>
      <Composition
        id="Reel01"
        component={Reel01}
        defaultProps={REEL01_DEFAULT_PROPS}
        calculateMetadata={calculateReel01Metadata}
        durationInFrames={buildTimeline(REEL01_DEFAULT_PROPS.spec.hookVariant, REEL01_DEFAULT_PROPS.timing).totalFrames}
        fps={REEL.fps}
        width={REEL.width}
        height={REEL.height}
      />
      <Composition
        id="Reel02"
        component={Reel02}
        defaultProps={REEL02_DEFAULT_PROPS}
        durationInFrames={REEL02_FRAMES}
        fps={REEL.fps}
        width={REEL.width}
        height={REEL.height}
      />
      <Composition
        id="Reel03"
        component={Reel03}
        defaultProps={REEL03_DEFAULT_PROPS}
        durationInFrames={REEL03_FRAMES}
        fps={REEL.fps}
        width={REEL.width}
        height={REEL.height}
      />
      {/* Dev only: never rendered into a reel. */}
      <Composition id="UiKitShowcase" component={UiKitShowcase} durationInFrames={60} fps={REEL.fps} width={2000} height={1400} />
    </>
  );
};
