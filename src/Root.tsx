import "./index.css";
import { useEffect, useState } from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { waitForStoryFonts } from "./theme/fonts";
import { calculateReel01Metadata } from "./reels/reel01/audio";
import { ReferenceCompare } from "./reels/reel01/dev/ReferenceCompare";
import { UiKitShowcase } from "./reels/reel01/dev/UiKitShowcase";
import { Reel01, REEL01_DEFAULT_PROPS } from "./reels/reel01/Reel01";
import { buildTimeline } from "./reels/reel01/timeline";
import { REEL } from "./reels/tokens";

/**
 * Registers every Reels composition. Holds the render until the fonts have
 * loaded (Archivo for headings, Lexend for body, plus the client-layer fonts
 * used inside device screens) so no frame is captured with fallback text.
 */
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
        durationInFrames={buildTimeline(REEL01_DEFAULT_PROPS.hookVariant).totalFrames}
        fps={REEL.fps}
        width={REEL.width}
        height={REEL.height}
      />
      {/* Dev only: never rendered into a reel. */}
      <Composition id="UiKitShowcase" component={UiKitShowcase} durationInFrames={60} fps={REEL.fps} width={2000} height={1400} />
      <Composition id="ReferenceCompare" component={ReferenceCompare} durationInFrames={1} fps={REEL.fps} width={3100} height={2080} />
    </>
  );
};
