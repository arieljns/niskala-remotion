import { Easing } from "remotion";
import { EASE } from "../theme/motion";
import { FONTS } from "../theme/fonts";
import { SENJA } from "../theme/senja";

/**
 * Tokens for the kinetic reel series. Colours shared with Senja come from
 * SENJA so the two can't drift; only the Mist surface and white card are new.
 */
export const REEL = { width: 1080, height: 1920, fps: 30 } as const;

export const COLORS = {
  mist: "#F4F0EC",
  mistBlob: "#FFFFFF",
  night: SENJA.night,
  ink: SENJA.plum900,
  cream: SENJA.cream100,
  accent: SENJA.red500,
  plum: SENJA.plum800,
  card: "#FFFFFF",
} as const;

export const SHADOWS = {
  card: "0 30px 60px -20px rgba(42,20,32,.25)",
  creamGlow: "0 0 36px rgba(255,233,190,.45)",
  accentGlow: "0 0 36px rgba(224,83,62,.45)",
  punchGlow: "0 0 60px rgba(224,83,62,.35)",
} as const;

export type TextStyle = {
  fontFamily: string;
  fontStretch: string;
  fontWeight: number;
  fontSize: number;
  letterSpacing: string;
  lineHeight: number;
};

export const TYPE = {
  sentence: {
    fontFamily: FONTS.display,
    fontStretch: "100%",
    fontWeight: 500,
    fontSize: 84,
    letterSpacing: "-0.025em",
    lineHeight: 1.1,
  },
  /** Base size only: useS1Hook scales it until the longest line fills the safe width. */
  hook: {
    fontFamily: FONTS.display,
    fontStretch: "100%",
    fontWeight: 700,
    fontSize: 84,
    letterSpacing: "-0.03em",
    lineHeight: 1.04,
  },
  punch: {
    fontFamily: FONTS.display,
    fontStretch: "125%",
    fontWeight: 700,
    fontSize: 260,
    letterSpacing: "-0.04em",
    lineHeight: 1,
  },
  squash: {
    fontFamily: FONTS.display,
    fontStretch: "125%",
    fontWeight: 700,
    fontSize: 150,
    letterSpacing: "-0.04em",
    lineHeight: 1,
  },
  outro: {
    fontFamily: FONTS.display,
    fontStretch: "100%",
    fontWeight: 500,
    fontSize: 96,
    letterSpacing: "-0.025em",
    lineHeight: 1.1,
  },
  uiBody: {
    fontFamily: FONTS.body,
    fontStretch: "100%",
    fontWeight: 400,
    fontSize: 34,
    letterSpacing: "0em",
    lineHeight: 1.2,
  },
  uiLabel: {
    fontFamily: FONTS.body,
    fontStretch: "100%",
    fontWeight: 600,
    fontSize: 40,
    letterSpacing: "0em",
    lineHeight: 1.2,
  },
} as const satisfies Record<string, TextStyle>;

/**
 * Message hierarchy inside a sentence, marked in the copy: **accent** (the point,
 * red and heaviest), __strong__ (what the point is about), ~~quiet~~ (connecting
 * words that recede). Unmarked words keep the sentence's own weight.
 */
export const TONES = {
  accent: { fontWeight: 800, fontStretch: "112%", letterSpacing: "-0.035em" },
  strong: { fontWeight: 800, fontStretch: "100%", letterSpacing: "-0.03em" },
  quiet: { fontWeight: 300, fontStretch: "100%", letterSpacing: "-0.02em" },
} as const;
export type Tone = keyof typeof TONES;

export const EASINGS = {
  brand: EASE,
  camera: Easing.bezier(0.7, 0, 0.2, 1),
  pop: Easing.bezier(0.34, 1.8, 0.64, 1),
} as const;

/**
 * Frames at 30 fps. wordGap, wordGapBlack and pullBackOverlap are the tightened
 * timing agreed after Stage 1 (the brief's 6 / 5 / 0 overran the reel by ~4.8 s).
 */
export const MOTION = {
  wordIn: 12,
  wordGap: 4,
  wordGapBlack: 3,
  out: 8,
  pullBack: 15,
  pullBackOverlap: 8,
  holdMin: 24,
  /** Stillness before a data moment, so the hit lands. */
  stillBeforeHit: 9,
  /** Half-width of the content crossfade at the middle of a morph step (5 f total). */
  morphFadeHalf: 2.5,
} as const;

/** Readable area in screen space, and the point the camera aims at (its centre). */
export const SAFE_ZONE = { left: 64, right: 940, top: 220, bottom: 1480 } as const;
export const FOCAL = {
  x: (SAFE_ZONE.left + SAFE_ZONE.right) / 2,
  y: (SAFE_ZONE.top + SAFE_ZONE.bottom) / 2,
} as const;

export const CAMERA_ZOOM = { follow: 1.3, fitMax: 1, stack: 1.1, lineChase: 1.2, drift: 1.03, dot: 2.4, tag: 1.8 } as const;
