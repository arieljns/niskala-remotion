import { Easing, interpolate, useCurrentFrame } from "remotion";
import { AssetSlot } from "./AssetSlot";
import { EASINGS } from "./tokens";

/** Around the 520 x 1100 screen. The bezel leaves room for the TODO label until the render exists. */
export const PHONE_OUTER = { width: 568, height: 1148, radius: 76 } as const;

const ENTRANCE_FRAMES = 21;

/** Wraps TODO_PHONE_RENDER: rises 160 px and turns from rotateY 25deg to 0 around the screen. */
export const PhoneFrame: React.FC<{ x: number; y: number; startFrame: number }> = ({ x, y, startFrame }) => {
  const frame = useCurrentFrame();
  if (frame < startFrame) {
    return null;
  }
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const end = startFrame + ENTRANCE_FRAMES;
  const rise = interpolate(frame, [startFrame, end], [160, 0], { ...clamp, easing: EASINGS.brand });
  const turn = interpolate(frame, [startFrame, end], [25, 0], { ...clamp, easing: EASINGS.brand });

  return (
    <div
      style={{
        position: "absolute",
        left: x - PHONE_OUTER.width / 2,
        top: y - PHONE_OUTER.height / 2,
        width: PHONE_OUTER.width,
        height: PHONE_OUTER.height,
        borderRadius: PHONE_OUTER.radius,
        overflow: "hidden",
        opacity: interpolate(frame, [startFrame, startFrame + 4], [0, 1], { ...clamp, easing: Easing.linear }),
        transform: `translateY(${rise}px) perspective(1800px) rotateY(${turn}deg)`,
      }}
    >
      <AssetSlot
        id="TODO_PHONE_RENDER"
        style={{ alignItems: "flex-start", padding: 2, borderRadius: PHONE_OUTER.radius, background: "#E4DFDB" }}
      />
    </div>
  );
};
