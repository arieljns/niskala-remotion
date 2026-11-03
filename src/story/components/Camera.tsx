import { useLayout } from "../../useLayout";

export type CameraProps = {
  /** Logical size of the content being filmed (e.g. 393x852 for a phone PNG). */
  contentWidth: number;
  contentHeight: number;
  /** Point of the content (logical units) placed at the canvas anchor. */
  focusX: number;
  focusY: number;
  /** Canvas px per logical unit. */
  scale: number;
  /** Where on the canvas the focus point lands, as fractions of width/height. Defaults to centre. */
  anchorX?: number;
  anchorY?: number;
  /** Keep the content's edges outside the canvas (no background showing). Only
   *  meaningful when the content covers the canvas at this scale. */
  clampToEdges?: boolean;
  /** Size of the area the camera fills; defaults to the whole canvas. Split
   *  screens pass their half so each side frames its own shot. */
  viewportWidth?: number;
  viewportHeight?: number;
  children: React.ReactNode;
};

/**
 * A 2D camera over content laid out in logical units: frames `focus` at the
 * canvas anchor at `scale`. Scenes animate focus/scale with easedInterpolate
 * for push-ins and drifts; vertical scenes use it to crop into a region of a
 * laptop screen instead of shrinking the whole device.
 */
export const Camera: React.FC<CameraProps> = ({
  contentWidth,
  contentHeight,
  focusX,
  focusY,
  scale,
  anchorX = 0.5,
  anchorY = 0.5,
  clampToEdges = false,
  viewportWidth,
  viewportHeight,
  children,
}) => {
  const layout = useLayout();
  const width = viewportWidth ?? layout.width;
  const height = viewportHeight ?? layout.height;
  let x = width * anchorX - focusX * scale;
  let y = height * anchorY - focusY * scale;

  if (clampToEdges) {
    x = Math.min(0, Math.max(width - contentWidth * scale, x));
    y = Math.min(0, Math.max(height - contentHeight * scale, y));
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: contentWidth,
        height: contentHeight,
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        transformOrigin: "0 0",
      }}
    >
      {children}
    </div>
  );
};
