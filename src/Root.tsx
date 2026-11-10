import "./index.css";
import { useEffect, useState } from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { waitUntilDone } from "./fonts";
import { waitForStoryFonts } from "./theme/fonts";
import { PreviewHarness } from "./PreviewHarness";
import { registerExplainer } from "./registerExplainer";
import { FondasiExplainer } from "./compositions/fondasi/FondasiExplainer";
import { PantauExplainer } from "./compositions/pantau/PantauExplainer";
import { KendaliExplainer } from "./compositions/kendali/KendaliExplainer";
import { ChunkOne, CHUNK_ONE_DURATION_FRAMES, CHUNK_ONE_FPS } from "./ChunkOne";
import { NiskalaStory, type NiskalaStoryProps } from "./story/NiskalaStory";
import { SHOW_PAIN_INTRO } from "./story/constants";
import { getStoryDuration, STORY_FPS } from "./story/timeline";
import { StoryComponentTests } from "./story/tests/ComponentTests";
import { StoryActCompositions } from "./story/ActCompositions";
import { calculateReel01Metadata } from "./reels/reel01/audio";
import { ReferenceCompare } from "./reels/reel01/dev/ReferenceCompare";
import { UiKitShowcase } from "./reels/reel01/dev/UiKitShowcase";
import { Reel01, REEL01_DEFAULT_PROPS } from "./reels/reel01/Reel01";
import { buildTimeline } from "./reels/reel01/timeline";
import { REEL } from "./reels/tokens";

/**
 * Registers every <Composition> in this project. Filled in stage by stage
 * per the build order: shared-component preview harness (stage 2),
 * paket-fondasi-explainer (stage 3), paket-pantau-explainer (stage 4),
 * paket-kendali-explainer (stage 5) — each via `registerExplainer`, which
 * handles both aspect-ratio variants (section 4's common settings) so they
 * don't have to be hand-registered twice per video. Delays the render until
 * Manrope has actually loaded, so no composition in this project ever risks
 * capturing a frame with unstyled fallback text.
 */
export const RemotionRoot: React.FC = () => {
  const [handle] = useState(() => delayRender("Waiting for Manrope + Senja/client story fonts to load"));

  useEffect(() => {
    // Older series use src/fonts.ts (Manrope); the NiskalaStory series uses
    // src/theme/fonts.ts (Archivo 125, Lexend, Manrope, Inter).
    Promise.all([waitUntilDone(), waitForStoryFonts()])
      .then(() => continueRender(handle))
      .catch((err) => {
        throw err;
      });
  }, [handle]);

  return (
    <>
      <Composition
        id="preview-harness"
        component={PreviewHarness}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
      {registerExplainer("paket-fondasi-explainer", FondasiExplainer)}
      {registerExplainer("paket-pantau-explainer", PantauExplainer)}
      {registerExplainer("paket-kendali-explainer", KendaliExplainer)}

      {/* Service-demo series, chunk 1 of 3 — same component, two canvases. */}
      <Composition
        id="ChunkOneDesktop"
        component={ChunkOne}
        durationInFrames={CHUNK_ONE_DURATION_FRAMES}
        fps={CHUNK_ONE_FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="ChunkOneMobile"
        component={ChunkOne}
        durationInFrames={CHUNK_ONE_DURATION_FRAMES}
        fps={CHUNK_ONE_FPS}
        width={1080}
        height={1920}
      />

      {/* NiskalaStory — one buyer, one brand. Same component, two canvases;
          duration follows the showPainIntro prop (Act 0 on/off). */}
      {(
        [
          { id: "NiskalaStory", width: 1920, height: 1080 },
          { id: "NiskalaStoryVertical", width: 1080, height: 1920 },
        ] as const
      ).map((canvas) => (
        <Composition
          key={canvas.id}
          id={canvas.id}
          component={NiskalaStory}
          defaultProps={{ showPainIntro: SHOW_PAIN_INTRO } satisfies NiskalaStoryProps}
          calculateMetadata={({ props }) => ({ durationInFrames: getStoryDuration(props.showPainIntro) })}
          durationInFrames={getStoryDuration(SHOW_PAIN_INTRO)}
          fps={STORY_FPS}
          width={canvas.width}
          height={canvas.height}
        />
      ))}
      <StoryActCompositions />
      <StoryComponentTests />

      {/* Kinetic reel series. */}
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
