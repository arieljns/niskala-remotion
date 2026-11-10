import { Checks } from "@phosphor-icons/react";
import { CLIENT, CLIENT_FONTS } from "../../../theme/client";
import { CHAT } from "./chatTheme";
import { ChatSlot } from "./ChatSlot";

export type ChatBubbleProps = {
  side: "in" | "out";
  time: string;
  startFrame: number;
  typingFrames?: number;
  /** Message text; may contain <b> for order numbers etc. */
  children: React.ReactNode;
};

/** Plain text message. Incoming is white, outgoing is ink with read ticks. */
export const ChatBubble: React.FC<ChatBubbleProps> = ({ side, time, startFrame, typingFrames, children }) => {
  const incoming = side === "in";

  return (
    <ChatSlot side={side} startFrame={startFrame} typingFrames={typingFrames}>
      <div
        style={{
          maxWidth: 307,
          boxSizing: "border-box",
          padding: "10px 14px 8px",
          borderRadius: CHAT.radius,
          backgroundColor: incoming ? CHAT.incoming : CHAT.outgoing,
          color: incoming ? CLIENT.ink : CLIENT.white,
          fontFamily: CLIENT_FONTS.chat,
          fontSize: CHAT.textSize,
          fontWeight: 400,
          lineHeight: 1.32,
        }}
      >
        {children}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 3,
            marginTop: 2,
            fontSize: 12,
            color: incoming ? CHAT.meta : "rgba(255,255,255,0.65)",
          }}
        >
          {time}
          {incoming ? null : <Checks size={14} />}
        </div>
      </div>
    </ChatSlot>
  );
};
