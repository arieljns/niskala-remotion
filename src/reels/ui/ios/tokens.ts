import { Easing, interpolate, staticFile } from "remotion";
import { FONTS } from "../../../theme/fonts";
import { COLORS } from "../../tokens";

/** Everything in this folder is drawn in phone points on a 393 x 852 screen. */
export const PHONE = { width: 393, height: 852, radius: 55, bezel: 11 } as const;
export const PHONE_OUTER = {
  width: PHONE.width + PHONE.bezel * 2,
  height: PHONE.height + PHONE.bezel * 2,
  radius: PHONE.radius + PHONE.bezel,
} as const;
export const MARGIN = 16;
/** Top of the content under the status bar and Dynamic Island. */
export const SAFE_TOP = 59;
/** Top of page content under the browser bar. */
export const BROWSER_TOP = 104;

export const IOS = {
  bg: "#FFFFFF",
  bg2: "#F2F2F7",
  label: "#000000",
  label2: "rgba(60,60,67,.6)",
  label3: "rgba(60,60,67,.3)",
  separator: "rgba(60,60,67,.29)",
  blue: "#007AFF",
  green: "#34C759",
  /** The store's own brand colour. */
  store: COLORS.plum,
  imageLight: "#F3F4F6",
  imageDark: "#2A2A2C",
  sheetDark: "#1C1C1E",
  darkLabel2: "rgba(235,235,245,.6)",
  darkSeparator: "rgba(255,255,255,.14)",
} as const;

export const INTER = FONTS.clientChat;

export const TEXT = {
  largeTitle: { fontSize: 34, lineHeight: "41px", fontWeight: 700, letterSpacing: "-0.022em" },
  title2: { fontSize: 22, lineHeight: "28px", fontWeight: 700, letterSpacing: "-0.02em" },
  title3: { fontSize: 20, lineHeight: "25px", fontWeight: 600, letterSpacing: "-0.017em" },
  headline: { fontSize: 17, lineHeight: "22px", fontWeight: 600, letterSpacing: "-0.012em" },
  body: { fontSize: 17, lineHeight: "22px", fontWeight: 400, letterSpacing: "-0.012em" },
  subheadline: { fontSize: 15, lineHeight: "20px", fontWeight: 400, letterSpacing: "-0.008em" },
  footnote: { fontSize: 13, lineHeight: "18px", fontWeight: 400, letterSpacing: "-0.003em" },
  caption: { fontSize: 12, lineHeight: "16px", fontWeight: 400, letterSpacing: "0em" },
} as const;

export const screenRoot: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  fontFamily: INTER,
  fontFeatureSettings: '"cv11", "ss01"',
  color: IOS.label,
  whiteSpace: "nowrap",
};

const GLASS_BLUR = "blur(30px) saturate(180%)";
export const GLASS_LIGHT: React.CSSProperties = {
  background: "rgba(255,255,255,.72)",
  backdropFilter: GLASS_BLUR,
  WebkitBackdropFilter: GLASS_BLUR,
};
export const GLASS_DARK: React.CSSProperties = {
  background: "rgba(30,30,30,.72)",
  backdropFilter: GLASS_BLUR,
  WebkitBackdropFilter: GLASS_BLUR,
};

export const SHEET_SPRING = { damping: 26, stiffness: 300, mass: 1 } as const;
/** 0.35 s at 30 fps. */
export const PUSH_FRAMES = 11;
const PUSH_EASE = Easing.bezier(0.32, 0.72, 0, 1);
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0..1 through a page push. */
export const pushProgress = (frame: number, start: number, frames: number = PUSH_FRAMES): number =>
  interpolate(frame, [start, start + frames], [0, 1], { ...CLAMP, easing: PUSH_EASE });

const PRESS_FRAMES = 4;
/** 1 while the finger is down. */
export const pressAmount = (frame: number, at: number | undefined): number =>
  at !== undefined && frame >= at && frame < at + PRESS_FRAMES ? 1 : 0;
export const pressStyle = (press: number): React.CSSProperties =>
  press > 0 ? { transform: `scale(${1 - 0.03 * press})`, filter: `brightness(${1 - 0.08 * press})` } : {};

/** A very slow push-in for product images. */
export const kenBurns = (frame: number, frames = 240): number =>
  interpolate(frame, [0, frames], [1, 1.03], CLAMP);

const PRODUCT_DIR = "reels/reel01-pack/reel01/products";
export const ASSET = {
  hero: staticFile(`${PRODUCT_DIR}/termos_led_transparent.png`),
  silver: staticFile(`${PRODUCT_DIR}/botol_silver_darkbg.png`),
  black: staticFile(`${PRODUCT_DIR}/botol_hitam_darkbg.png`),
  blue: staticFile(`${PRODUCT_DIR}/botol_biru_darkbg.png`),
  green: staticFile(`${PRODUCT_DIR}/botol_hijau_darkbg.png`),
} as const;
export const HERO_RATIO = 237 / 718;

/* Copy with no confirmed source yet: defaults from the brief, in one place. */
export const STORE_HANDLE = "tokokamu";
export const STORE_URL = "tokokamu.com";
export const STORE_WORDMARK = "TOKOKAMU";
export const HERO = { name: "Termos LED 500 ml", price: "Rp450.000" } as const;
export const TODO_LED_READOUT = "45°";
export const TODO_PRODUCT_NAMES = [
  { name: "Botol Steel 750 ml", price: "Rp480.000", image: ASSET.silver },
  { name: "Botol Hitam 1 L", price: "Rp520.000", image: ASSET.black },
  { name: "Botol Biru 950 ml", price: "Rp590.000", image: ASSET.blue },
] as const;
export const TODO_ORDER_DATE = "3 Nov 2026, 19.00";
export const TODO_PROFILE_STATS = { posts: "128", followers: "12,4 rb", following: "210" } as const;
export const TODO_IG_HANDLE = "niskalaworks.dev";
export const TODO_NISKALA_BIO = "Website buat toko online · tips jualan";
export const ORDER_NUMBER = "TKM-0001";
