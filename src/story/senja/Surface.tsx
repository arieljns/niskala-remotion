import { createContext, useContext, useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { easedInterpolate } from "../../theme/motion";
import { SENJA, SENJA_GRADIENTS, type SurfaceKind } from "../../theme/senja";
import { useLayout } from "../../useLayout";

/**
 * The three Senja section surfaces (DESIGN-SYSTEM.md §2.3, feed v7 CSS),
 * as full-frame scene backgrounds: base fill, one corner glow (night and
 * paper only), dot grid, contour lines, film grain. Children render between
 * the decoration and the grain, and can read the surface via useSurface().
 */
const SurfaceContext = createContext<SurfaceKind>("paper");
export const useSurface = () => useContext(SurfaceContext);

/** Berry decoration on paper (feed uses #C2414A; we keep to the berry token). */
const PAPER_DECOR = SENJA.berry500;

export type SurfaceProps = {
  kind: SurfaceKind;
  /** Glow centre, as CSS percentages. Defaults: night 80%/88%, paper 100%/100%. */
  glowAt?: [string, string];
  /** Frame the glow starts its ~900ms fade-in; it should land after the device. */
  glowFrom?: number;
  children?: React.ReactNode;
};

export const Surface: React.FC<SurfaceProps> = ({ kind, glowAt, glowFrom = 14, children }) => {
  const base =
    kind === "night" ? { backgroundColor: SENJA.night } : kind === "paper" ? { backgroundColor: SENJA.paper50 } : { background: SENJA_GRADIENTS.sunset };

  return (
    <SurfaceContext.Provider value={kind}>
      <AbsoluteFill style={{ ...base, overflow: "hidden" }}>
        {kind === "sunset" ? null : <Glow kind={kind} at={glowAt} from={glowFrom} />}
        <DotGrid kind={kind} />
        <Contours kind={kind} />
        {children}
        <Grain kind={kind} />
      </AbsoluteFill>
    </SurfaceContext.Provider>
  );
};

/** One corner glow per night/paper scene; fades in last over ~27 frames (900ms). */
export const Glow: React.FC<{ kind: "night" | "paper"; at?: [string, string]; from: number }> = ({ kind, at, from }) => {
  const frame = useCurrentFrame();
  const opacity = easedInterpolate(frame, [from, from + 27], [0, 1]);
  const background = kind === "night" ? SENJA_GRADIENTS.glowNight(at) : SENJA_GRADIENTS.glowPaper(at);
  return <AbsoluteFill style={{ background, opacity }} />;
};

/** 72px dot grid at a 1440px-wide frame, scaled with the canvas. 16% (12% berry on paper). */
export const DotGrid: React.FC<{ kind: SurfaceKind }> = ({ kind }) => {
  const { width } = useLayout();
  const k = width / 1440;
  const cell = 72 * k;
  const color = kind === "paper" ? PAPER_DECOR : SENJA.cream100;

  return (
    <AbsoluteFill
      style={{
        color,
        opacity: kind === "paper" ? 0.12 : 0.16,
        backgroundImage: `radial-gradient(circle, currentColor ${1.6 * k}px, transparent ${2.2 * k}px)`,
        backgroundSize: `${cell}px ${cell}px`,
        backgroundPosition: `${cell / 2}px ${cell / 2}px`,
      }}
    />
  );
};

/** The feed's 16 offset wave lines, bottom-right, drifting slowly. Cream 28% (berry 16% on paper). */
export const Contours: React.FC<{ kind: SurfaceKind }> = ({ kind }) => {
  const frame = useCurrentFrame();
  const { width, height } = useLayout();
  const scale = Math.max(width, height) / 1350;
  const drift = Math.sin(frame / 75) * 14;
  const paths = Array.from({ length: 16 }, (_, i) => {
    const o = i * 16;
    return `M0 ${300 + o} C 220 ${180 + o}, 420 ${380 + o}, 640 ${160 + o} S 900 ${60 + o}, 1100 ${o}`;
  });

  return (
    <svg
      width={1100}
      height={560}
      viewBox="0 0 1100 560"
      fill="none"
      stroke={kind === "paper" ? PAPER_DECOR : SENJA.cream100}
      strokeOpacity={kind === "paper" ? 0.16 : 0.28}
      strokeWidth={1.4}
      style={{
        position: "absolute",
        right: -80 * scale,
        bottom: -60 * scale,
        transform: `translate(${drift}px, ${drift * 0.4}px) scale(${scale})`,
        transformOrigin: "100% 100%",
      }}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
};

/** feTurbulence film grain; the seed changes every 2 frames. 10% overlay (5% multiply on paper). */
export const Grain: React.FC<{ kind: SurfaceKind }> = ({ kind }) => {
  const frame = useCurrentFrame();
  const { width, height } = useLayout();
  const id = `grain${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const paper = kind === "paper";

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: "absolute",
        inset: 0,
        opacity: paper ? 0.05 : 0.1,
        mixBlendMode: paper ? "multiply" : "overlay",
        pointerEvents: "none",
        zIndex: 200,
      }}
    >
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves={2} seed={Math.floor(frame / 2)} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
};
