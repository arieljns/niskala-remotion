import { Img } from "remotion";
import { CLIENT } from "../../theme/client";
import { SENJA_DEVICE, SENJA_SHADOWS } from "../../theme/senja";
import { ContohPin } from "./ContohChip";

/**
 * Logical iPhone geometry, measured from public/.../framed/*.png (3x):
 * 20pt of frame around a 393x852 screen, Dynamic Island 126x37 at
 * 11pt from the top. Overlay children are positioned in screen coordinates
 * (0..393, 0..852), the same space as the flat PNG at 1x.
 *
 * The body is Senja staging (feed v7 plum-black phone, deep floating shadow);
 * the screen inside stays client-themed.
 */
export const PHONE_SCREEN = { width: 393, height: 852, radius: 50 } as const;
const BEZEL = 20;
const OUTER = { width: PHONE_SCREEN.width + BEZEL * 2, height: PHONE_SCREEN.height + BEZEL * 2, radius: 70 } as const;
const ISLAND = { width: 126, height: 37, top: 11 } as const;

export const PHONE_ASPECT = OUTER.height / OUTER.width;

export type PhoneFrameProps = {
  /** Flat 393x852 (3x) screenshot. Omit when the screen is rebuilt in React via children. */
  src?: string;
  /** Rendered width of the whole phone, frame included, in canvas px. */
  width: number;
  /** Tilt in degrees (±7 in 16:9, ±3 in 9:16); scenes settle it to 0 on the key moment. */
  tilt?: number;
  /** Pin the "Contoh data" chip to this device. */
  contoh?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ src, width, tilt = 0, contoh = false, style, children }) => {
  const scale = width / OUTER.width;

  return (
    <div style={{ position: "relative", width, height: OUTER.height * scale, transform: `rotate(${tilt}deg)`, ...style }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: OUTER.width,
          height: OUTER.height,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Side buttons: action + volume on the left, power on the right. */}
        {[
          { side: "left", top: 150, height: 30 },
          { side: "left", top: 205, height: 58 },
          { side: "left", top: 275, height: 58 },
          { side: "right", top: 230, height: 90 },
        ].map((b) => (
          <div
            key={`${b.side}-${b.top}`}
            style={{
              position: "absolute",
              top: b.top,
              [b.side]: -3,
              width: 5,
              height: b.height,
              borderRadius: 2,
              backgroundColor: SENJA_DEVICE.phoneButton,
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: OUTER.radius,
            background: SENJA_DEVICE.phoneBody,
            boxShadow: `${SENJA_SHADOWS.device}, inset 0 0 0 1.5px ${SENJA_DEVICE.phoneEdge}`,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: BEZEL,
            top: BEZEL,
            width: PHONE_SCREEN.width,
            height: PHONE_SCREEN.height,
            borderRadius: PHONE_SCREEN.radius,
            overflow: "hidden",
            backgroundColor: CLIENT.bg,
          }}
        >
          {src ? (
            <Img
              src={src}
              style={{
                position: "absolute",
                inset: 0,
                width: PHONE_SCREEN.width,
                height: PHONE_SCREEN.height,
                translate: "12.2px 13.7px",
              }}
            />
          ) : null}
          {children}

          <div
            style={{
              position: "absolute",
              left: (PHONE_SCREEN.width - ISLAND.width) / 2,
              top: ISLAND.top,
              width: ISLAND.width,
              height: ISLAND.height,
              borderRadius: ISLAND.height / 2,
              backgroundColor: "#000",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: 13,
                top: (ISLAND.height - 11) / 2,
                width: 11,
                height: 11,
                borderRadius: "50%",
                backgroundColor: "#1A1C2A",
              }}
            />
          </div>

          {/* Subtle diagonal glare across the glass. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: "linear-gradient(118deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 45%)",
            }}
          />
        </div>
      </div>
      {contoh ? <ContohPin /> : null}
    </div>
  );
};
