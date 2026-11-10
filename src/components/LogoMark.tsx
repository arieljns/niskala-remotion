import type { CSSProperties } from "react";
import { Img } from "remotion";
import { LOGOS } from "../assets";

/**
 * The recurring Niskala two-shape mark. Purely presentational — size /
 * rotate / scale are controlled by whichever beat is using it as a
 * connective element (the "gate" in Beat2Migration, the sign-off in
 * Beat6Outcome), so this component never animates on its own.
 */
export function LogoMark({
  size,
  rotate = 0,
  scale = 1,
  style,
}: {
  size: number;
  rotate?: number;
  scale?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotate}deg) scale(${scale})`,
        ...style,
      }}
    >
      <Img src={LOGOS.niskalaMark} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
