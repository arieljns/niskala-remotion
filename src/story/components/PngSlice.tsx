import { Img } from "remotion";

/**
 * One rectangle cut out of a flat screen PNG, drawn at logical size. Lets a
 * scene move part of a screenshot on its own (e.g. table rows sliding down)
 * while the rest of the PNG stays put underneath.
 */
export const PngSlice: React.FC<{
  src: string;
  /** Full logical size of the PNG (1210x756 laptop, 393x852 phone). */
  imageWidth: number;
  imageHeight: number;
  /** The cut, in the PNG's logical coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
  style?: React.CSSProperties;
}> = ({ src, imageWidth, imageHeight, x, y, width, height, style }) => (
  <div style={{ position: "absolute", width, height, overflow: "hidden", ...style }}>
    <Img src={src} style={{ position: "absolute", left: -x, top: -y, width: imageWidth, height: imageHeight }} />
  </div>
);
