import { useCurrentFrame } from "remotion";
import { easedInterpolate } from "../../theme/motion";
import { SENJA_GRADIENTS } from "../../theme/senja";
import { useLayout, type Layout } from "../../useLayout";
import { laptopCamera, type LaptopShot } from "../laptopShot";
import { Camera } from "./Camera";
import { ContohChip } from "./ContohChip";
import { LAPTOP_OUTER, LaptopFrame } from "./LaptopFrame";

/** Whole laptop with margin inside a vault window. */
export const WHOLE_IN_WINDOW: LaptopShot = { cx: 605, cy: 380, span: 1500, anchorY: 0.42 };

export type Rect = { left: number; top: number; width: number; height: number };

/** The vault window for one admin laptop: right of the caption in 16:9, below it in 9:16. */
export function getVaultWindow(layout: Layout): Rect {
  const { width: W, height: H } = layout;
  return layout.isPortrait
    ? { left: W * 0.06, top: H * 0.34, width: W * 0.88, height: H * 0.66 }
    : { left: W * 0.44, top: H * 0.12, width: W * 0.52, height: H * 0.88 };
}

/** A laptop showing one admin PNG, filmed by a camera that eases between two shots. */
export const LaptopShotView: React.FC<{
  src: string;
  from: LaptopShot;
  to: LaptopShot;
  frames: [number, number];
  viewportWidth?: number;
  viewportHeight?: number;
  children?: React.ReactNode;
}> = ({ src, from, to, frames, viewportWidth, viewportHeight, children }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const t = easedInterpolate(frame, frames, [0, 1]);
  const camera = laptopCamera(from, to, t, viewportWidth ?? layout.width);

  return (
    <Camera
      contentWidth={LAPTOP_OUTER.width}
      contentHeight={LAPTOP_OUTER.height}
      viewportWidth={viewportWidth}
      viewportHeight={viewportHeight}
      {...camera}
    >
      <LaptopFrame src={src} width={LAPTOP_OUTER.width}>
        {children}
      </LaptopFrame>
    </Camera>
  );
};

/**
 * The stage behind every admin laptop: a grad-fill vault card (rounded top,
 * bleeding off the bottom) that also clips the laptop camera, so close crops
 * read as a framed shot. The "Contoh data" chip is pinned to its top edge.
 */
export const VaultWindow: React.FC<{ rect: Rect; contoh?: boolean; children: React.ReactNode }> = ({ rect, contoh = true, children }) => {
  const layout = useLayout();
  const radius = layout.isPortrait ? 40 : 64;
  return (
    <>
      <div
        style={{
          position: "absolute",
          ...rect,
          borderRadius: `${radius}px ${radius}px 0 0`,
          overflow: "hidden",
          background: SENJA_GRADIENTS.card,
          boxShadow: "0 -1px 0 rgba(255,255,255,.3) inset",
        }}
      >
        {children}
      </div>
      {contoh ? (
        <ContohChip style={{ position: "absolute", top: rect.top - 16, left: rect.left + rect.width * 0.91, transform: "translateX(-100%)" }} />
      ) : null}
    </>
  );
};
