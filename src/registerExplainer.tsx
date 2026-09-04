import { Composition } from "remotion";
import { ASPECT_RATIOS, getDurationInFrames } from "./tokens";

/**
 * 30fps — the brief's fallback tier ("prefer 60fps if render time and file
 * size are acceptable, fall back to 30fps otherwise"). Kept at 30 through
 * the build stages for fast iteration; bumping every composition to 60fps
 * later is this one constant, not a rewrite.
 */
export const FPS = 30;

/**
 * Registers both aspect-ratio variants (section 4's common settings) for one
 * package-explainer composition, so each `paket-*-explainer` only has to be
 * listed once in Root.tsx instead of by hand, twice, per video.
 */
export function registerExplainer(id: string, component: React.FC) {
  return Object.values(ASPECT_RATIOS).map((ratio) => (
    <Composition
      key={ratio.suffix}
      id={`${id}-${ratio.suffix}`}
      component={component}
      durationInFrames={getDurationInFrames(FPS)}
      fps={FPS}
      width={ratio.width}
      height={ratio.height}
    />
  ));
}
