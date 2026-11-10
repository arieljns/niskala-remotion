import { FONTS } from "./fonts";

/**
 * The "Toko Anda" client UI: everything rendered INSIDE a phone or laptop
 * screen (rebuilt chat, chart, stars, bars, overlays on the PNGs). These are
 * the old Niskala cream/ink/sienna values, kept unchanged because the client
 * mockup PNGs were designed with them. Never use them outside a device
 * screen; that is senja.ts territory.
 */
export const CLIENT = {
  bg: "#F7F3EA",
  paper: "#FFFDF9",
  ink: "#2B2620",
  ink2: "#4A4239",
  muted: "#8A8178",
  line: "#E9E1D4",
  accent: "#E8562A",
  green: "#2F8F5B",
  /** Pure white used by the admin PNGs' cards and chat bubbles. */
  white: "#FFFFFF",
} as const;

export const CLIENT_FONTS = {
  /** Client UI text (headers, labels, numbers). */
  ui: FONTS.client,
  /** Chat message text. */
  chat: FONTS.clientChat,
} as const;
