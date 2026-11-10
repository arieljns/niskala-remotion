import { TypingIndicator } from "./TypingIndicator";
import { useChatEntrance } from "./chatTheme";

export type ChatSlotProps = {
  side: "in" | "out";
  /** Scene-relative frame the item springs in. */
  startFrame: number;
  /** Frames of typing indicator before an incoming item. Ignored for outgoing. */
  typingFrames?: number;
  width?: number | string;
  children: React.ReactNode;
};

/**
 * Reserves the item's final space in the thread from frame 0, so items land
 * exactly where the PNG has them; shows the typing indicator in that space
 * first, then springs the item in from its own corner.
 */
export const ChatSlot: React.FC<ChatSlotProps> = ({ side, startFrame, typingFrames = 0, width, children }) => {
  const { typing, typingIn, enter, visible } = useChatEntrance(startFrame, side === "in" ? typingFrames : 0);
  const incoming = side === "in";

  return (
    <div style={{ position: "relative", alignSelf: incoming ? "flex-start" : "flex-end", width }}>
      {typing ? (
        <TypingIndicator style={{ position: "absolute", left: 0, top: 0, opacity: typingIn }} />
      ) : null}
      <div
        style={{
          opacity: visible ? enter : 0,
          transform: `translateY(${(1 - enter) * 10}px) scale(${0.92 + 0.08 * enter})`,
          transformOrigin: incoming ? "top left" : "bottom right",
        }}
      >
        {children}
      </div>
    </div>
  );
};
