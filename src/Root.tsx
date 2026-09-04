import "./index.css";
import { useEffect, useState } from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { waitUntilDone } from "./fonts";
import { PreviewHarness } from "./PreviewHarness";
import { registerExplainer } from "./registerExplainer";
import { FondasiExplainer } from "./compositions/fondasi/FondasiExplainer";
import { PantauExplainer } from "./compositions/pantau/PantauExplainer";
import { KendaliExplainer } from "./compositions/kendali/KendaliExplainer";

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
  const [handle] = useState(() => delayRender("Waiting for Manrope to load"));

  useEffect(() => {
    waitUntilDone()
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
    </>
  );
};
