import { loadFont as loadFontFile } from "@remotion/fonts";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadLexend } from "@remotion/google-fonts/Lexend";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { staticFile } from "remotion";

/**
 * Every typeface used by the NiskalaStory video, in one place.
 *
 * Niskala layer (Senja): Archivo at width 125 for display, Lexend for small text.
 * Client layer (inside device screens): Manrope, plus Inter for chat messages.
 *
 * Archivo is self-hosted: @remotion/google-fonts/Archivo only serves
 * single-weight files at normal width (no `wdth` axis), so `font-stretch: 125%`
 * would silently render normal width. public/fonts/ holds Google's variable
 * Archivo woff2 (latin subset, wdth 62–125, wght 100–900), fetched from
 * fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900.
 *
 * Fonts were matched by eye to the Canva sales deck. If the deck uses
 * different fonts, only this file should need to change.
 */
const ARCHIVO_FAMILY = "NW Archivo";

const archivo = loadFontFile({
  family: ARCHIVO_FAMILY,
  url: staticFile("fonts/archivo-variable-wdth-wght-latin.woff2"),
  weight: "100 900",
  stretch: "62% 125%",
  format: "woff2",
});

const lexend = loadLexend("normal", { weights: ["300", "400", "600"], subsets: ["latin"] });
const manrope = loadManrope("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });
const inter = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

export const FONTS = {
  display: ARCHIVO_FAMILY,
  body: lexend.fontFamily,
  client: manrope.fontFamily,
  clientChat: inter.fontFamily,
} as const;

/** Archivo is always set expanded in the Niskala layer. */
export const DISPLAY_STRETCH = "125%";

/** Senja tracking: −0.045em at display size, −0.03em under 40px. */
export function displayTracking(fontSizePx: number): string {
  return fontSizePx >= 40 ? "-0.045em" : "-0.03em";
}

/** Base style for any Archivo text in the Niskala layer. */
export function displayFont(fontSizePx: number, weight: 300 | 500 | 700): React.CSSProperties {
  return {
    fontFamily: FONTS.display,
    fontStretch: DISPLAY_STRETCH,
    fontWeight: weight,
    fontSize: fontSizePx,
    letterSpacing: displayTracking(fontSizePx),
  };
}

/** Eyebrow / chip label: Lexend uppercase with +0.14em tracking. */
export function eyebrowFont(fontSizePx: number, weight: 400 | 600 = 600): React.CSSProperties {
  return {
    fontFamily: FONTS.body,
    fontWeight: weight,
    fontSize: fontSizePx,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  };
}

/** Resolves once every story font has loaded; Root gates rendering on it. */
export function waitForStoryFonts(): Promise<unknown> {
  return Promise.all([archivo, lexend.waitUntilDone(), manrope.waitUntilDone(), inter.waitUntilDone()]);
}
