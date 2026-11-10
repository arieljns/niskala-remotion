import { Img } from "remotion";
import { CLIENT, CLIENT_FONTS } from "../../theme/client";
import { SENJA_DEVICE, SENJA_SHADOWS } from "../../theme/senja";
import { ContohPin } from "./ContohChip";

/**
 * Logical MacBook geometry, measured from public/.../framed/*.png (2x):
 * a 1248-wide lid with 19pt side bezels, 20pt top bezel, a 24pt macOS menu
 * bar, the 1210x756 screen, a 26pt chin, then a 1380-wide silver base.
 * Overlay children are positioned in screen coordinates (0..1210, 0..756),
 * the same space as the flat PNG at 1x — the menu bar sits above it.
 *
 * The lid and base are Senja staging (feed v7 plum-black bezel, warm base,
 * deep floating shadow); the menu bar and screen stay client-themed.
 */
export const LAPTOP_SCREEN = { width: 1210, height: 756 } as const;
const SIDE_BEZEL = 19;
const TOP_BEZEL = 20;
const MENU_BAR = 24;
const CHIN = 26;
const LID = {
  width: LAPTOP_SCREEN.width + SIDE_BEZEL * 2,
  height: TOP_BEZEL + MENU_BAR + LAPTOP_SCREEN.height + CHIN,
  radius: 22,
} as const;
const BASE = { width: 1380, height: 22 } as const;
const OUTER = { width: BASE.width, height: LID.height + BASE.height } as const;
const LID_LEFT = (OUTER.width - LID.width) / 2;

/** Where the screen's top-left sits inside the whole laptop, in logical units —
 *  used by scenes that crop the camera onto a region of the screen. */
export const LAPTOP_SCREEN_ORIGIN = { x: LID_LEFT + SIDE_BEZEL, y: TOP_BEZEL + MENU_BAR } as const;
export const LAPTOP_OUTER = OUTER;

export type LaptopFrameProps = {
  /** Flat 1210x756 (2x) screenshot. */
  src?: string;
  /** Rendered width of the whole laptop (base included), in canvas px. */
  width: number;
  /** Tilt in degrees (±7 in 16:9, ±3 in 9:16); scenes settle it to 0 on the key moment. */
  tilt?: number;
  /** Pin the "Contoh data" chip to this device. */
  contoh?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

const MenuBar: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: SIDE_BEZEL,
      top: TOP_BEZEL,
      width: LAPTOP_SCREEN.width,
      height: MENU_BAR,
      backgroundColor: "#141414",
      color: CLIENT.white,
      fontFamily: CLIENT_FONTS.ui,
      fontSize: 12.5,
      fontWeight: 500,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 18px",
      boxSizing: "border-box",
    }}
  >
    <div style={{ display: "flex", gap: 18 }}>
      <span style={{ fontWeight: 700 }}>Chrome</span>
      <span>File</span>
      <span>Edit</span>
      <span>View</span>
      <span>History</span>
    </div>
    <div style={{ display: "flex", gap: 14 }}>
      <span>Sel 13 Okt</span>
      <span>10.20</span>
    </div>
  </div>
);

export const LaptopFrame: React.FC<LaptopFrameProps> = ({ src, width, tilt = 0, contoh = false, style, children }) => {
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

        {/* Lid */}
        <div
          style={{
            position: "absolute",
            left: LID_LEFT,
            top: 0,
            width: LID.width,
            height: LID.height,
            borderRadius: `${LID.radius}px ${LID.radius}px 0 0`,
            backgroundColor: SENJA_DEVICE.bezel,
            boxShadow: `inset 0 0 0 1.5px ${SENJA_DEVICE.bezelEdge}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: CHIN,
              backgroundColor: SENJA_DEVICE.bezel,
            }}
          />
          <MenuBar />
          {/* Notch with camera, hanging into the menu bar — same black as the bar,
            so only the camera dot reads, as in the framed PNGs. */}
          <div
            style={{
              position: "absolute",
              left: (LID.width - 190) / 2,
              top: TOP_BEZEL - 1,
              width: 190,
              height: MENU_BAR + 2,
              borderRadius: "0 0 9px 9px",
              backgroundColor: SENJA_DEVICE.bezel,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 95 - 3.5,
                top: 8,
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "#1E2233",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              left: SIDE_BEZEL,
              top: TOP_BEZEL + MENU_BAR,
              width: LAPTOP_SCREEN.width,
              height: LAPTOP_SCREEN.height,
              overflow: "hidden",
              backgroundColor: CLIENT.bg,
            }}
          >
            {src ? (
              <Img
                src={src}
                style={{ position: "absolute", inset: 0, width: LAPTOP_SCREEN.width, height: LAPTOP_SCREEN.height }}
              />
            ) : null}
            {children}
          </div>
        </div>

        {/* Base: warm deck with the thumb notch; it carries the floating shadow. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: LID.height,
            width: BASE.width,
            height: BASE.height,
            borderRadius: `3px 3px ${BASE.height}px ${BASE.height}px / 3px 3px ${BASE.height * 0.9}px ${BASE.height * 0.9}px`,
            background: SENJA_DEVICE.laptopBase,
            boxShadow: SENJA_SHADOWS.device,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: (BASE.width - 200) / 2,
              top: 0,
              width: 200,
              height: 7,
              borderRadius: "0 0 8px 8px",
              background: SENJA_DEVICE.laptopBaseNotch,
            }}
          />
        </div>
      </div>
      {contoh ? <ContohPin /> : null}
    </div>
  );
};
