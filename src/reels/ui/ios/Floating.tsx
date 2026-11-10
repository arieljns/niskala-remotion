import { Avatar } from "./ReelScreen";
import { Bag, Lock, PersonPlus, Reload } from "./icons";
import { GLASS_LIGHT, HERO, INTER, IOS, TEXT, TODO_IG_HANDLE, TODO_NISKALA_BIO, pressStyle } from "./tokens";

export const NOTIFICATION = { x: 9, y: 54, width: 375, height: 74 } as const;

/** iOS banner. Size is fixed; the caller positions and springs it. */
export const IosNotification: React.FC<{ title?: string; body?: string; style?: React.CSSProperties }> = ({
  title = "Pesanan baru masuk",
  body = `${HERO.name} · ${HERO.price}`,
  style,
}) => (
  <div
    style={{
      width: NOTIFICATION.width,
      height: NOTIFICATION.height,
      boxSizing: "border-box",
      borderRadius: 24,
      ...GLASS_LIGHT,
      boxShadow: "0 12px 34px -10px rgba(0,0,0,.28), inset 0 0 0 .5px rgba(255,255,255,.5)",
      display: "flex",
      alignItems: "center",
      gap: 11,
      padding: "0 14px 0 13px",
      fontFamily: INTER,
      color: "#000",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <div style={{ width: 42, height: 42, borderRadius: 10, background: IOS.store, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Bag size={24} color="#FFF" />
    </div>
    <div style={{ flexGrow: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ ...TEXT.subheadline, fontWeight: 600 }}>{title}</span>
        <span style={{ ...TEXT.footnote, color: IOS.label2 }}>sekarang</span>
      </div>
      <div style={{ ...TEXT.subheadline, marginTop: 1 }}>{body}</div>
    </div>
  </div>
);

export const FollowerToast: React.FC<{ text?: string; style?: React.CSSProperties }> = ({
  text = "+1 pengikut baru",
  style,
}) => (
  <div
    style={{
      ...TEXT.subheadline,
      fontWeight: 600,
      height: 46,
      padding: "0 18px 0 13px",
      borderRadius: 23,
      ...GLASS_LIGHT,
      boxShadow: "0 12px 30px -10px rgba(0,0,0,.28), inset 0 0 0 .5px rgba(255,255,255,.5)",
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontFamily: INTER,
      color: "#000",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <PersonPlus size={21} color={IOS.blue} />
    {text}
  </div>
);

export const DmBubble: React.FC<{ text?: string; style?: React.CSSProperties }> = ({ text = "Kak, masih ada?", style }) => (
  <div style={{ display: "inline-flex", alignItems: "flex-end", gap: 7, fontFamily: INTER, whiteSpace: "nowrap", ...style }}>
    <Avatar size={28} letter="R" background="#8E8E93" />
    <div style={{ ...TEXT.body, padding: "8px 14px", borderRadius: 19, borderBottomLeftRadius: 5, background: "#E9E9EB", color: "#000", boxShadow: "0 10px 26px -12px rgba(0,0,0,.28)" }}>{text}</div>
  </div>
);

export const PROFILE_CARD = { width: 360, height: 212 } as const;
export const IKUTI_BOX = { x: 18, y: 148, width: 324, height: 44 } as const;

/** 0 shows Ikuti, 1 shows Mengikuti; `press` is the finger. */
export const ProfileHeaderCard: React.FC<{ followed?: number; press?: number }> = ({ followed = 0, press = 0 }) => (
  <div
    style={{
      position: "relative",
      width: PROFILE_CARD.width,
      height: PROFILE_CARD.height,
      borderRadius: 28,
      background: "#FFF",
      boxShadow: "0 30px 60px -20px rgba(42,20,32,.25)",
      fontFamily: INTER,
      color: "#000",
      whiteSpace: "nowrap",
    }}
  >
    <div style={{ position: "absolute", left: 18, top: 20, display: "flex", alignItems: "center", gap: 13 }}>
      {/* TODO_LOGO: N monogram until the logo is supplied. */}
      <Avatar size={68} letter="N" />
      <div>
        <div style={{ ...TEXT.headline, fontWeight: 700, fontSize: 20, lineHeight: "26px" }}>Niskala Works</div>
        <div style={{ ...TEXT.subheadline, color: IOS.label2 }}>{TODO_IG_HANDLE}</div>
      </div>
    </div>
    <div style={{ ...TEXT.subheadline, position: "absolute", left: 18, top: 105, color: "#1C1C1E" }}>{TODO_NISKALA_BIO}</div>
    <div
      style={{
        ...TEXT.headline,
        position: "absolute",
        left: IKUTI_BOX.x,
        top: IKUTI_BOX.y,
        width: IKUTI_BOX.width,
        height: IKUTI_BOX.height,
        borderRadius: 12,
        overflow: "hidden",
        ...pressStyle(press),
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: IOS.blue, color: "#FFF", opacity: 1 - followed, display: "flex", alignItems: "center", justifyContent: "center" }}>Ikuti</div>
      <div style={{ position: "absolute", inset: 0, background: IOS.bg2, color: "#000", opacity: followed, display: "flex", alignItems: "center", justifyContent: "center" }}>Mengikuti</div>
    </div>
  </div>
);

export const SafariUrlBar: React.FC<{ url?: string; style?: React.CSSProperties }> = ({ url = TODO_IG_HANDLE, style }) => (
  <div
    style={{
      width: 340,
      height: 50,
      borderRadius: 25,
      boxSizing: "border-box",
      ...GLASS_LIGHT,
      background: "rgba(255,255,255,.82)",
      boxShadow: "0 18px 40px -16px rgba(42,20,32,.3), inset 0 0 0 .5px rgba(255,255,255,.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      fontFamily: INTER,
      color: "#000",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    <span style={{ ...TEXT.subheadline, fontWeight: 500 }}>
      <span style={{ fontSize: 12 }}>a</span>A
    </span>
    <span style={{ ...TEXT.body, display: "flex", alignItems: "center", gap: 6 }}>
      <Lock size={13} color="#3C3C43" />
      {url}
    </span>
    <Reload size={19} color="#000" />
  </div>
);
