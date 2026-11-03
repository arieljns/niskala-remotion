/**
 * Senja: the Niskala Works design system, for everything OUTSIDE a device
 * screen (backgrounds, captions, sticker tags, chips, highlights, device
 * staging, end card). Values copied from ~/Desktop/niskala/DESIGN-SYSTEM.md
 * §2 and docs/reference/niskala-works-feed-v7.html. Never use these inside a
 * phone/laptop screen; that is client.ts territory (the one exception is the
 * Highlight ring + dim, which is Niskala staging drawn over the screen).
 */
export const SENJA = {
  night: "#150C11",
  plum900: "#2A1420",
  plum800: "#3A1424",
  plum700: "#4A1C30",
  plum500: "#8A2E4E",
  berry500: "#9E3D5E",
  red500: "#E0533E",
  coral500: "#E8603F",
  orange400: "#F59A57",
  amber400: "#F4AE4A",
  yellow300: "#FDD663",
  cream100: "#FFE9BE",
  paper50: "#FFFCF7",
  rule: "#EFE2DA",
  muted: "#6A4A55",
} as const;

export const SENJA_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

/** Glow centre as CSS lengths/percentages, e.g. ["80%", "88%"]. */
type GlowAt = [string, string];

/** Gradients exactly as in DESIGN-SYSTEM.md §2.2 (the --gx/--gy vars become arguments). */
export const SENJA_GRADIENTS = {
  sunset:
    "radial-gradient(60% 45% at 10% 95%, rgba(168,74,110,.9), transparent 70%), " +
    "radial-gradient(48% 34% at 104% -2%, rgba(253,214,99,.85) 0%, rgba(253,214,99,0) 75%), " +
    "linear-gradient(160deg, #B83A45 0%, #9A3248 30%, #C9433F 58%, #E5653F 82%, #F2944F 100%)",
  glowNight: ([gx, gy]: GlowAt = ["80%", "88%"]) =>
    `radial-gradient(circle at ${gx} ${gy}, #FDD663 0, #F59A57 9%, #E0533E 20%, rgba(158,61,94,.6) 36%, rgba(70,22,40,.25) 52%, transparent 68%)`,
  glowPaper: ([gx, gy]: GlowAt = ["100%", "100%"]) =>
    `radial-gradient(circle at ${gx} ${gy}, rgba(245,154,87,.6) 0, rgba(217,73,58,.25) 22%, transparent 46%)`,
  card:
    "radial-gradient(70% 50% at 100% 0%, rgba(253,214,99,.9), transparent 70%), " +
    "radial-gradient(60% 50% at 0% 100%, rgba(138,46,78,.9), transparent 70%), " +
    "linear-gradient(160deg, #F4A055, #E0533E 50%, #9E3D5E)",
  /** Accent phrase on paper. */
  textLight: "linear-gradient(90deg, #F4AE4A 0%, #E8603F 40%, #8A2E4E 100%)",
  /** Accent phrase on night. */
  textDark: "linear-gradient(90deg, #FDD663, #F59A57 45%, #EE6E4E)",
  bar: "linear-gradient(90deg, #8A2E4E, #E0533E 55%, #F59A57)",
  /** Glass vault fill (DESIGN-SYSTEM.md §4.5). */
  vaultGlass: "linear-gradient(180deg, rgba(255,240,215,.22), rgba(255,240,215,.06))",
} as const;

export const SENJA_SHADOWS = {
  /** Floating device mockups. */
  device: "0 60px 100px -30px rgba(30,8,18,.8)",
  /** Sticker tags and pills. */
  tag: "0 18px 30px -16px rgba(30,8,18,.6)",
} as const;

/** Glass panel: required behind small text on Sunset (and allowed on Night). */
export const SENJA_GLASS = {
  background: "rgba(42,20,32,.55)",
  backdropFilter: "blur(14px)",
  border: "1.5px solid rgba(255,233,190,.2)",
  borderRadius: 28,
} as const;

export type SurfaceKind = "night" | "paper" | "sunset";

/** Text and accent treatment per surface (DESIGN-SYSTEM.md §2.3). */
export const SURFACE_STYLE: Record<SurfaceKind, { text: string; accent: { gradient: string } | { solid: string } }> = {
  night: { text: SENJA.cream100, accent: { gradient: SENJA_GRADIENTS.textDark } },
  paper: { text: SENJA.plum900, accent: { gradient: SENJA_GRADIENTS.textLight } },
  sunset: { text: SENJA.cream100, accent: { solid: SENJA.plum800 } },
};

/**
 * Device mockup materials from the feed v7 CSS (.phone, .lap .scr, .lap .base).
 * These are the frame bodies only; the screens inside stay client-themed.
 */
export const SENJA_DEVICE = {
  phoneBody: "linear-gradient(150deg, #5A3A48, #140A10 28%, #140A10 72%, #4A2E3A)",
  phoneEdge: "rgba(255,255,255,.08)",
  phoneButton: "#4A2E3A",
  bezel: "#140A10",
  bezelEdge: "rgba(255,255,255,.1)",
  laptopBase: "linear-gradient(180deg, #E6DCD6, #A8998F)",
  laptopBaseNotch: "linear-gradient(180deg, #9A8B81, #B4A69C)",
} as const;
