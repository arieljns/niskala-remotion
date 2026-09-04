import { loadFont } from "@remotion/google-fonts/Manrope";

/**
 * Kicks off loading Manrope as soon as this module is imported (module-level
 * side effect, matches every other font-loading example in Remotion's docs).
 * `fontFamily` is the CSS value every `<KineticText>` / headline uses;
 * `waitUntilDone()` is consumed once, in Root.tsx, via delayRender /
 * continueRender so rendering never captures a frame before Manrope has
 * actually painted — no system-font flash on render.
 */
export const { fontFamily, waitUntilDone } = loadFont("normal", {
  weights: ["500", "600", "700", "800"],
  subsets: ["latin"],
});
