import { IOS, INTER, PHONE, PHONE_OUTER } from "./tokens";

export type BarVariant = "dark" | "light";

const StatusIcons: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <svg viewBox="0 0 19 13" width={18} height={12.4}>
      {[0, 1, 2, 3].map((bar) => {
        const height = 4 + bar * 3;
        return <rect key={bar} x={bar * 5} y={13 - height} width={3.6} height={height} rx={1} fill={color} />;
      })}
    </svg>
    <svg viewBox="0 0 18 13" width={17} height={12.3}>
      <path
        fill={color}
        d="M9 2.6c2.6 0 5 1 6.8 2.7.1.1.3.1.4 0l1.3-1.3c.2-.2.2-.4 0-.6A12.5 12.5 0 0 0 9 0C5.7 0 2.7 1.3.5 3.4c-.2.2-.2.4 0 .6l1.3 1.3c.1.1.3.1.4 0A9.8 9.8 0 0 1 9 2.6Zm0 4.3c1.4 0 2.8.5 3.8 1.5.2.1.4.1.5 0l1.3-1.3c.2-.2.2-.4 0-.6a8.3 8.3 0 0 0-11.2 0c-.2.2-.2.4 0 .6l1.3 1.3c.1.1.3.1.5 0a5.6 5.6 0 0 1 3.8-1.5Zm2.5 3c.2-.2.2-.4 0-.6a3.8 3.8 0 0 0-5 0c-.2.2-.2.4 0 .6l2.2 2.2c.2.2.4.2.6 0l2.2-2.2Z"
      />
    </svg>
    <svg viewBox="0 0 28 13" width={27} height={12.5}>
      <rect x=".5" y=".5" width="23.5" height="12" rx="3.6" fill="none" stroke={color} strokeOpacity=".4" />
      <rect x="2" y="2" width="20.5" height="9" rx="2.3" fill={color} />
      <path d="M25.5 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill={color} fillOpacity=".45" />
    </svg>
  </div>
);

export const IosStatusBar: React.FC<{ variant?: BarVariant }> = ({ variant = "dark" }) => {
  const color = variant === "dark" ? IOS.label : "#FFFFFF";
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 30px 0 44px",
        boxSizing: "border-box",
        color,
        fontFamily: INTER,
        fontSize: 16.5,
        fontWeight: 600,
        letterSpacing: "-0.01em",
      }}
    >
      <span>9:41</span>
      <StatusIcons color={color} />
    </div>
  );
};

/** Side buttons, in the titanium of the frame. */
const SIDE_BUTTONS = [
  { side: "left", top: 150, height: 28 },
  { side: "left", top: 208, height: 56 },
  { side: "left", top: 276, height: 56 },
  { side: "right", top: 232, height: 84 },
] as const;

/**
 * A generic modern phone, drawn in code: thin dark titanium band, black bezel,
 * island and home indicator. Sits at 0,0 and is PHONE_OUTER in size.
 */
export const PhoneShell: React.FC<{
  children?: React.ReactNode;
  bar?: BarVariant;
  /** Colour of the home indicator; follows the bar by default. */
  indicator?: BarVariant;
  shadow?: boolean;
}> = ({ children, bar = "dark", indicator, shadow = true }) => (
  <div
    style={{
      position: "relative",
      width: PHONE_OUTER.width,
      height: PHONE_OUTER.height,
      borderRadius: PHONE_OUTER.radius,
      boxShadow: shadow ? "0 46px 90px -34px rgba(42,20,32,.42), 0 12px 30px -14px rgba(42,20,32,.22)" : undefined,
    }}
  >
    {SIDE_BUTTONS.map((button) => (
      <div
        key={`${button.side}-${button.top}`}
        style={{
          position: "absolute",
          [button.side]: -1.8,
          top: button.top,
          width: 3,
          height: button.height,
          borderRadius: 1.5,
          background: "linear-gradient(90deg,#55565A,#2B2C2F)",
        }}
      />
    ))}
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: PHONE_OUTER.radius,
        background: "linear-gradient(145deg,#6D6E73 0%,#2E2F33 22%,#1E1F22 50%,#35363A 78%,#77787D 100%)",
      }}
    />
    <div style={{ position: "absolute", inset: 2.2, borderRadius: PHONE_OUTER.radius - 2.2, background: "#050506" }} />
    <div
      style={{
        position: "absolute",
        left: PHONE.bezel,
        top: PHONE.bezel,
        width: PHONE.width,
        height: PHONE.height,
        borderRadius: PHONE.radius,
        overflow: "hidden",
        background: IOS.bg,
      }}
    >
      {children}
      <IosStatusBar variant={bar} />
      <div
        style={{
          position: "absolute",
          left: (PHONE.width - 126) / 2,
          top: 11,
          width: 126,
          height: 37,
          borderRadius: 19,
          background: "#000",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (PHONE.width - 136) / 2,
          bottom: 8,
          width: 136,
          height: 5,
          borderRadius: 3,
          background: (indicator ?? bar) === "dark" ? "#000" : "#fff",
        }}
      />
    </div>
  </div>
);
