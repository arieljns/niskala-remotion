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
  // The full weight set the Niskala design system uses (MASTER.md §2.3):
  // 400/500 for body & captions, 600 the heading workhorse, 700 for
  // secondary headings/labels, 800 reserved for the display-1 wordmark and
  // proof-stat numbers only. 400 is loaded so unweighted body copy renders
  // as real Manrope Regular, not a faux-thinned 500.
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});
