import { Img, interpolate, useCurrentFrame } from "remotion";
import { ASSET, HERO_RATIO, HERO, INTER, IOS, TODO_LED_READOUT, kenBurns } from "./tokens";

/** Below this the photo's "150 °C" can't be read, so it needs no cover. */
const LED_MIN_HEIGHT = 110;

/** The photo's display says 150 °C. A coded readout covers it wherever it could be read. */
export const HeroImage: React.FC<{ height: number; style?: React.CSSProperties; shadow?: boolean }> = ({
  height,
  style,
  shadow,
}) => (
  <div style={{ position: "relative", width: height * HERO_RATIO, height, flexShrink: 0, ...style }}>
    <Img
      src={ASSET.hero}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        filter: shadow ? "drop-shadow(0 16px 18px rgba(0,0,0,.22))" : undefined,
      }}
    />
    {height >= LED_MIN_HEIGHT ? (
      <svg viewBox="0 0 237 718" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <filter id="led-soft" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>
        <ellipse cx="119" cy="45" rx="58" ry="17" fill="#17171A" filter="url(#led-soft)" />
        <text
          x="112"
          y="55"
          textAnchor="middle"
          fontFamily={INTER}
          fontSize="30"
          fontWeight="500"
          fill="#F3F5F7"
          letterSpacing="1"
        >
          {TODO_LED_READOUT}
        </text>
        <circle cx="149" cy="50" r="3.2" fill={IOS.green} />
      </svg>
    ) : null}
  </div>
);

/** Rounded card holding the hero photo, with the slow Ken Burns move. */
export const HeroCard: React.FC<{
  width: number | string;
  height: number;
  imageHeight: number;
  dark?: boolean;
  radius?: number;
  children?: React.ReactNode;
}> = ({ width, height, imageHeight, dark, radius = 12, children }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: radius,
        background: dark ? IOS.imageDark : IOS.imageLight,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ scale: String(kenBurns(frame)) }}>
        <HeroImage height={imageHeight} />
      </div>
      {children}
    </div>
  );
};

/** The dark-background bottle photos have a baked-in rounded card, so their edges are faded into ours. */
export const DarkProductImage: React.FC<{ src: string; height: number }> = ({ src, height }) => (
  <div style={{ width: "100%", height, borderRadius: 10, overflow: "hidden", background: IOS.imageDark, position: "relative" }}>
    <Img
      src={src}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        height: "102%",
        translate: "-50% -50%",
        maskImage: "radial-gradient(ellipse 50% 50%, #000 86%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 50% 50%, #000 86%, transparent 100%)",
      }}
    />
  </div>
);

const DIGIT_ROLL = 9;
const DIGIT_STAGGER = 0.5;

/** Digits roll into place from `start`. Before that the row is still empty of value. */
export const RollingPrice: React.FC<{ value?: string; start: number; style?: React.CSSProperties }> = ({
  value = HERO.price,
  start,
  style,
}) => {
  const frame = useCurrentFrame();
  const lineHeight = 1.25;
  return (
    <span style={{ display: "inline-flex", fontVariantNumeric: "tabular-nums", lineHeight, ...style }}>
      {value.split("").map((char, index) => {
        const digit = Number(char);
        if (Number.isNaN(digit)) {
          return <span key={index}>{char}</span>;
        }
        const roll = interpolate(frame, [start + index * DIGIT_STAGGER, start + index * DIGIT_STAGGER + DIGIT_ROLL], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: (t) => 1 - Math.pow(1 - t, 3),
        });
        const position = (10 + digit) * roll;
        return (
          <span key={index} style={{ display: "inline-block", height: `${lineHeight}em`, overflow: "hidden" }}>
            <span style={{ display: "block", transform: `translateY(${-position * lineHeight}em)` }}>
              {Array.from({ length: 20 }, (_, n) => (
                <span key={n} style={{ display: "block", height: `${lineHeight}em` }}>
                  {n % 10}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};

export const Swatch: React.FC<{ color: string; selected?: boolean; size: number; ringColor?: string }> = ({
  color,
  selected,
  size,
  ringColor = "#000",
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      padding: 3,
      boxSizing: "border-box",
      border: `1.5px solid ${selected ? ringColor : "transparent"}`,
    }}
  >
    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: color, boxShadow: "inset 0 0 0 .5px rgba(0,0,0,.18)" }} />
  </div>
);

export const SILVER_SWATCH = "linear-gradient(135deg,#F2F3F5 0%,#9A9DA3 48%,#E5E6E9 100%)";
export const SWATCHES = [SILVER_SWATCH, "#2A2A2C", "#223358", "#2F5A3F"] as const;
