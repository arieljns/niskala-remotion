import { useCurrentFrame } from "remotion";
import { CHAT } from "./chatTheme";

/** Incoming "…" bubble: three dots hopping in sequence. */
export const TypingIndicator: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 38,
        padding: "0 16px",
        borderRadius: CHAT.radius,
        backgroundColor: CHAT.incoming,
        ...style,
      }}
    >
      {[0, 1, 2].map((i) => {
        const wave = Math.max(0, Math.sin(frame * 0.38 - i * 0.9));
        return (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: CHAT.meta,
              opacity: 0.55 + 0.45 * wave,
              transform: `translateY(${-3 * wave}px)`,
            }}
          />
        );
      })}
    </div>
  );
};
