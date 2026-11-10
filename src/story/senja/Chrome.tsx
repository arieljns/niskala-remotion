import { WhatsappLogo } from "@phosphor-icons/react";
import { displayFont, FONTS } from "../../theme/fonts";
import { SENJA, SENJA_GLASS, SENJA_GRADIENTS, SENJA_SHADOWS } from "../../theme/senja";
import { BRAND_NAME } from "../constants";
import { useSurface } from "./Surface";

/**
 * Small Senja pieces: arrow chip, glass panel, brand logo and the WhatsApp
 * CTA pill. Sizes are canvas px.
 */

/** 96×46 bar-gradient pill with a cream arrow (plum-800 fill on sunset). End card only. */
export const ArrowChip: React.FC<{ scale?: number }> = ({ scale = 1 }) => {
  const surface = useSurface();
  return (
    <div
      style={{
        width: 96 * scale,
        height: 46 * scale,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        background: surface === "sunset" ? SENJA.plum800 : SENJA_GRADIENTS.bar,
        flex: "none",
      }}
    >
      <svg width={40 * scale} height={18 * scale} viewBox="0 0 40 18" fill="none" stroke={SENJA.cream100} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9h35M29 2l8 7-8 7" />
      </svg>
    </div>
  );
};

/** Plum glass behind small text on Sunset (and allowed on Night). */
export const GlassPanel: React.FC<{ style?: React.CSSProperties; children: React.ReactNode }> = ({ style, children }) => (
  <div style={{ ...SENJA_GLASS, padding: "22px 28px", color: SENJA.cream100, ...style }}>{children}</div>
);

/**
 * The Niskala mark, traced from public/assets/logos/niskala-mark.svg (same
 * viewBox and paths). Inlined so the "N" can reverse to cream on Night and
 * Sunset; the orange slash, arc and dot stay brand orange everywhere.
 */
const MARK_ORANGE = "#e8562a";
const MARK_INK = "#2b2620";

export const NiskalaMark: React.FC<{ height: number; reversed?: boolean }> = ({ height, reversed = false }) => (
  <svg width={(height * 133) / 182} height={height} viewBox="657 290 133 182" style={{ flex: "none" }}>
    <path transform="translate(655.523705, 424.819167)" d="M 9.8125 11.28125 L 102.15625 -69.09375 L 127.96875 -39.4375 L 35.625 40.9375 Z" fill={MARK_ORANGE} />
    <path
      transform="translate(648.231766, 467.522017)"
      d="M 100.71875 0 L 49.28125 -59.4375 L 49.28125 0 L 13.171875 0 L 13.171875 -122.421875 L 47.515625 -122.421875 L 98.9375 -62.09375 L 98.9375 -122.421875 L 135.046875 -122.421875 L 135.046875 0 Z"
      fill={reversed ? SENJA.cream100 : MARK_INK}
    />
    <path
      transform="matrix(0.300995, -0.686951, 0.686951, 0.300995, 714.690258, 399.658769)"
      d="M 14.321934 26.929006 C 42.961185 42.158283 71.598566 42.160318 100.236755 26.928251"
      fill="none"
      stroke={MARK_ORANGE}
      strokeWidth={61}
    />
    <circle cx={763.73} cy={314.53} r={20.19} fill={MARK_ORANGE} />
  </svg>
);

/** Mark + "Niskala" wordmark (Archivo 700), coloured for the current surface. */
export const BrandLogo: React.FC<{ size?: number }> = ({ size = 28 }) => {
  const surface = useSurface();
  const color = surface === "paper" ? SENJA.plum900 : SENJA.cream100;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.4, color }}>
      <NiskalaMark height={size * 1.57} reversed={surface !== "paper"} />
      <span style={{ ...displayFont(size * 1.1, 700), lineHeight: 1 }}>{BRAND_NAME}</span>
    </div>
  );
};

/** Cream WhatsApp CTA pill: plum text, Phosphor WhatsappLogo (never green), arrow chip. */
export const CtaPill: React.FC<{ label: string; scale?: number }> = ({ label, scale = 1 }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 18 * scale,
      padding: `${10 * scale}px ${10 * scale}px ${10 * scale}px ${30 * scale}px`,
      borderRadius: 999,
      backgroundColor: SENJA.cream100,
      color: SENJA.plum900,
      boxShadow: SENJA_SHADOWS.tag,
    }}
  >
    <WhatsappLogo size={34 * scale} color={SENJA.plum900} />
    {/* Button label: Lexend 600 (DESIGN-SYSTEM.md §5, primary button). */}
    <span style={{ fontFamily: FONTS.body, fontWeight: 600, fontSize: 30 * scale, lineHeight: 1 }}>{label}</span>
    <ArrowChip scale={scale} />
  </div>
);
