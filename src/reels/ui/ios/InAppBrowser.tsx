import { useCurrentFrame } from "remotion";
import { Ellipsis, Lock, Xmark } from "./icons";
import { BROWSER_TOP, GLASS_LIGHT, IOS, MARGIN, PHONE, STORE_URL, TEXT, screenRoot } from "./tokens";

/** The address, in phone points: the most important zoom in the reel lands here. */
export const URL_BOX = { x: 90, y: 61, width: 213, height: 40 } as const;

export const BrowserSkeleton: React.FC = () => {
  const frame = useCurrentFrame();
  const bars: readonly (readonly [number, number, number, number])[] = [
    [0, 0, PHONE.width, 26],
    [MARGIN, 40, 110, 22],
    [MARGIN, 80, PHONE.width - MARGIN * 2, 276],
    [MARGIN, 368, 230, 20],
    [MARGIN, 396, 110, 22],
    [MARGIN, 430, PHONE.width - MARGIN * 2, 14],
    [MARGIN, 450, 260, 14],
    [MARGIN, 556, PHONE.width - MARGIN * 2, 48],
    [MARGIN, 614, PHONE.width - MARGIN * 2, 50],
  ];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: BROWSER_TOP, bottom: 0, background: IOS.bg, overflow: "hidden" }}>
      {bars.map(([x, y, width, height]) => (
        <div
          key={`${x}-${y}`}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width,
            height,
            borderRadius: 8,
            background: "linear-gradient(100deg,#ECEDF0 30%,#F7F8F9 50%,#ECEDF0 70%)",
            backgroundSize: "300% 100%",
            backgroundPosition: `${100 - ((frame * 22) % 200)}% 0`,
          }}
        />
      ))}
    </div>
  );
};

/** A full-screen sheet with its own address bar and no app name anywhere. Pages sit inside as children. */
export const InAppBrowser: React.FC<{ progress?: number; children?: React.ReactNode }> = ({ progress = 1, children }) => (
  <div style={{ ...screenRoot, background: IOS.bg }}>
    {children}
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: BROWSER_TOP,
        ...GLASS_LIGHT,
        borderBottom: `.5px solid ${IOS.separator}`,
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "absolute", left: 16, top: 69 }}>
        <Xmark size={22} />
      </div>
      <div
        style={{
          position: "absolute",
          left: URL_BOX.x,
          top: URL_BOX.y,
          width: URL_BOX.width,
          height: URL_BOX.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
        }}
      >
        <Lock size={13} color="#3C3C43" />
        <span style={{ ...TEXT.subheadline, fontWeight: 600 }}>{STORE_URL}</span>
      </div>
      <div style={{ position: "absolute", right: 16, top: 69 }}>
        <Ellipsis size={22} />
      </div>
      {progress < 1 ? (
        <div style={{ position: "absolute", left: 0, bottom: -0.5, height: 2.5, width: `${progress * 100}%`, background: IOS.blue }} />
      ) : null}
    </div>
  </div>
);
