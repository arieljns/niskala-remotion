import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, easedInterpolate, SPRING_CONFIG, withAlpha } from "../tokens";
import { arcPoint, getBagAnchor, getSiteAnchor, useLayout } from "../useLayout";
import { BrowserFrame } from "../components/BrowserFrame";
import { StorefrontMock } from "../components/mocks/StorefrontMock";
import { ICONS } from "../assets";

const CROWD = 16;
const CLUSTER_COLS = 3;

/** Deterministic 0-1 pseudo-random, stable per key across frames/renders. */
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Beat 1 (0-90) — shoppers leave the generic marketplace bag on the left
 * and swarm the commerce website on the right: each takes its own path,
 * pace and arrival spot, so the crowd gathers organically around the
 * frame's near edge rather than marching in formation. Landscape flows
 * left→right; portrait flows top→bottom. Bag and site anchors come from
 * useLayout so Beat2Migration continues from the same origin.
 */
export function Beat1ChaosOpen() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();

  const bag = getBagAnchor(layout);
  const site = getSiteAnchor(layout);
  const bagIn = spring({ frame, fps, config: SPRING_CONFIG });
  const siteIn = spring({ frame: frame - 12, fps, config: SPRING_CONFIG });
  const bagSize = layout.icon.lg * (layout.isPortrait ? 1.8 : 2.1);

  const frameW = layout.width * (layout.isPortrait ? 0.8 : 0.36);
  const frameH = frameW / (16 / 10);
  const dot = layout.baseUnit * 3.2;

  const clusterRows = Math.ceil(CROWD / CLUSTER_COLS);

  /** A shopper's loose starting spot around the bag and its jittered spot
   *  in the crowd pressing against the site. */
  const shopper = (i: number) => {
    const sa = rand(i) * Math.PI * 2;
    const sr = (0.5 + rand(i + 40) * 1.3) * bagSize;
    const start = { x: bag.x + Math.cos(sa) * sr, y: bag.y + Math.sin(sa) * sr };

    const col = i % CLUSTER_COLS;
    const row = Math.floor(i / CLUSTER_COLS);
    const jx = (rand(i + 7) - 0.5) * dot * 1.6;
    const jy = (rand(i + 13) - 0.5) * dot * 1.8;
    const dock = layout.isPortrait
      ? {
          x: site.x + (col - (CLUSTER_COLS - 1) / 2) * dot * 1.05 + jx,
          y: site.y - frameH / 2 - dot * 0.5 - row * dot * 0.9 + jy,
        }
      : {
          x: site.x - frameW / 2 - dot * 0.4 - col * dot * 0.9 + jx,
          y: site.y + (row - (clusterRows - 1) / 2) * dot * 1.0 + jy,
        };

    const depart = 6 + i * 1.9 + rand(i + 3) * 12;
    const dur = 26 + rand(i + 5) * 18;
    const p = easedInterpolate(frame, [depart, depart + dur], [0, 1]);
    const bow = (rand(i + 17) - 0.5) * layout.baseUnit * 16;
    return { pos: arcPoint(start, dock, p, bow), p };
  };

  return (
    <AbsoluteFill>
      {/* the website being swarmed */}
      <div
        style={{
          position: "absolute",
          left: site.x,
          top: site.y,
          transform: `translate(-50%, -50%) scale(${0.7 + siteIn * 0.3})`,
          opacity: siteIn,
        }}
      >
        <BrowserFrame widthPct={layout.isPortrait ? 0.8 : 0.36} showBrowserIcon>
          <StorefrontMock />
        </BrowserFrame>
      </div>

      {/* origin: the marketplace bag the shoppers are leaving */}
      <div
        style={{
          position: "absolute",
          left: bag.x,
          top: bag.y,
          transform: `translate(-50%, -50%) scale(${0.82 + bagIn * 0.18})`,
          opacity: bagIn * 0.9,
        }}
      >
        <div style={{ position: "relative" }}>
          <Img src={ICONS.shoppingBag} style={{ width: bagSize, height: bagSize }} />
          <div
            style={{
              position: "absolute",
              right: -bagSize * 0.12,
              bottom: -bagSize * 0.12,
              width: bagSize * 0.44,
              height: bagSize * 0.44,
              borderRadius: "50%",
              background: COLORS.cream,
              border: `${Math.max(2, layout.baseUnit * 0.12)}px solid ${withAlpha(COLORS.ink, 0.14)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Img src={ICONS.cart} style={{ width: "60%", height: "60%" }} />
          </div>
        </div>
      </div>

      {/* the swarm of shoppers */}
      {Array.from({ length: CROWD }).map((_, i) => {
        const { pos, p } = shopper(i);
        const appear = easedInterpolate(frame, [6 + i * 1.9, 6 + i * 1.9 + 8], [0, 1]);
        const accent = i % 3 === 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pos.x - dot / 2,
              top: pos.y - dot / 2,
              width: dot,
              height: dot,
              borderRadius: "50%",
              background: accent ? COLORS.accent : COLORS.cream,
              border: accent
                ? "none"
                : `${Math.max(1, layout.baseUnit * 0.1)}px solid ${withAlpha(COLORS.ink, 0.14)}`,
              boxShadow: accent
                ? `0 ${layout.baseUnit * 0.4}px ${layout.baseUnit}px ${withAlpha(COLORS.accent, 0.28)}`
                : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: appear * (0.55 + p * 0.45),
            }}
          >
            <Img
              src={ICONS.peopleGroup}
              style={{ width: "58%", height: "58%", filter: accent ? "brightness(0) invert(1)" : "none" }}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
