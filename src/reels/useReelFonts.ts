import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { waitForStoryFonts } from "../theme/fonts";

/**
 * True once the fonts have loaded. Reels measure text during render and
 * measureText caches its results, so nothing may measure before this is true:
 * a fallback-font width would stick for the rest of the session.
 */
export function useReelFonts(): boolean {
  const [handle] = useState(() => delayRender("Waiting for reel fonts"));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    waitForStoryFonts()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((err) => {
        throw err;
      });
  }, [handle]);

  return ready;
}
