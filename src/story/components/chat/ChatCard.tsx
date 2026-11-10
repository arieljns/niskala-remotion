import { CLIENT, CLIENT_FONTS } from "../../../theme/client";
import { CHAT } from "./chatTheme";
import { ChatSlot } from "./ChatSlot";

export type ChatCardProps = {
  /** Header colour: sienna for confirmations, ink for shipping. */
  tone: "accent" | "ink";
  eyebrow: string;
  title: string;
  time: string;
  startFrame: number;
  typingFrames?: number;
  children: React.ReactNode;
};

/** Incoming rich card: coloured header (eyebrow + title) over a white body. */
export const ChatCard: React.FC<ChatCardProps> = ({ tone, eyebrow, title, time, startFrame, typingFrames, children }) => (
  <ChatSlot side="in" startFrame={startFrame} typingFrames={typingFrames} width={300}>
    <div style={{ borderRadius: CHAT.radius, overflow: "hidden", backgroundColor: CHAT.incoming, fontFamily: CLIENT_FONTS.ui }}>
      <div
        style={{
          backgroundColor: tone === "accent" ? CLIENT.accent : CLIENT.ink,
          color: CLIENT.white,
          padding: "13px 14px 13px",
        }}
      >
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.85 }}>
          {eyebrow}
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, marginTop: 4, lineHeight: 1.2 }}>{title}</div>
      </div>
      <div style={{ padding: "12px 14px 8px", color: CLIENT.ink, fontSize: 15, fontWeight: 500, fontFamily: CLIENT_FONTS.chat }}>
        {children}
        <div style={{ textAlign: "right", fontSize: 12, color: CHAT.meta, marginTop: 6 }}>{time}</div>
      </div>
    </div>
  </ChatSlot>
);

/** Label/value row inside a ChatCard body ("No. resi", "Total dibayar"…). */
export const ChatCardRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0" }}>
    <span style={{ color: CHAT.meta }}>{label}</span>
    <span style={{ fontWeight: 700 }}>{value}</span>
  </div>
);
