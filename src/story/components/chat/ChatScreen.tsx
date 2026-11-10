import { BatteryFull, CaretLeft, PaperPlaneTilt, Phone, WifiHigh } from "@phosphor-icons/react";
import { CLIENT, CLIENT_FONTS } from "../../../theme/client";
import { PHONE_SCREEN } from "../PhoneFrame";
import { CHAT } from "./chatTheme";

/**
 * Rebuilt WhatsApp-style chat with "Toko Anda", laid out from
 * flat/11-wa-confirmation.png and flat/14-repeat-order.png: status bar,
 * header (to y=116), thread, input bar (from y=762), home indicator.
 * Children are the thread items, top to bottom.
 */
const HEADER_BOTTOM = 116;
const INPUT_TOP = 762;

export const ChatScreen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      width: PHONE_SCREEN.width,
      height: PHONE_SCREEN.height,
      backgroundColor: CHAT.background,
      fontFamily: CLIENT_FONTS.ui,
      color: CLIENT.ink,
    }}
  >
    {/* Status bar + header. Status bar glyphs are filled to match the iOS
        chrome in the PNGs (Phosphor's signal icon is a wedge, so the bars are
        drawn); every in-app icon uses Phosphor regular. */}
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: PHONE_SCREEN.width,
        height: HEADER_BOTTOM,
        backgroundColor: CHAT.bar,
        borderBottom: `1px solid ${CHAT.divider}`,
      }}
    >
      <div style={{ position: "absolute", left: 37, top: 16, fontSize: 17, fontWeight: 700 }}>09.41</div>
      <div style={{ position: "absolute", right: 30, top: 17, display: "flex", gap: 5, alignItems: "center" }}>
        <SignalBars />
        <WifiHigh size={18} weight="fill" />
        <BatteryFull size={24} weight="fill" />
      </div>
      <CaretLeft size={24} style={{ position: "absolute", left: 19, top: 70 }} />
      <div
        style={{
          position: "absolute",
          left: 56,
          top: 60,
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: CLIENT.accent,
          color: CLIENT.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        TA
      </div>
      <div style={{ position: "absolute", left: 112, top: 62 }}>
        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.15 }}>Toko Anda</div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: CHAT.online }}>online</div>
      </div>
      <Phone size={24} style={{ position: "absolute", right: 22, top: 70 }} />
    </div>

    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: HEADER_BOTTOM,
        bottom: PHONE_SCREEN.height - INPUT_TOP,
        overflow: "hidden",
        padding: `10px ${CHAT.sideMargin}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {children}
    </div>

    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: INPUT_TOP,
        bottom: 0,
        backgroundColor: CHAT.bar,
        borderTop: `1px solid ${CHAT.divider}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: CHAT.sideMargin,
          top: 12,
          width: 313,
          height: 41,
          borderRadius: 999,
          border: `1px solid ${CHAT.divider}`,
          backgroundColor: CLIENT.white,
          boxSizing: "border-box",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          fontSize: 15,
          color: CHAT.meta,
        }}
      >
        Tulis pesan...
      </div>
      <div
        style={{
          position: "absolute",
          right: 13,
          top: 11,
          width: 42,
          height: 42,
          borderRadius: "50%",
          backgroundColor: CLIENT.accent,
          color: CLIENT.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <PaperPlaneTilt size={20} />
      </div>
      <div
        style={{
          position: "absolute",
          left: (PHONE_SCREEN.width - 140) / 2,
          bottom: 8,
          width: 140,
          height: 5,
          borderRadius: 3,
          backgroundColor: CLIENT.ink,
        }}
      />
    </div>
  </div>
);

const SignalBars: React.FC = () => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 11, marginRight: 2 }}>
    {[4, 6, 8.5, 11].map((h) => (
      <div key={h} style={{ width: 3, height: h, borderRadius: 1, backgroundColor: CLIENT.ink }} />
    ))}
  </div>
);

/** Centred day separator ("Selasa, 13 Okt", "Hari ini"). */
export const DateChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      alignSelf: "center",
      backgroundColor: CHAT.dateChip,
      color: CHAT.dateChipText,
      fontSize: 13,
      fontWeight: 600,
      padding: "4px 12px",
      borderRadius: 10,
    }}
  >
    {children}
  </div>
);
