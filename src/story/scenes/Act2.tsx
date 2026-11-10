import { useCurrentFrame } from "remotion";
import { storyFlat, type StoryScreen } from "../../assets";
import { easedInterpolate } from "../../theme/motion";
import { useLayout, type Layout } from "../../useLayout";
import { Camera } from "../components/Camera";
import { Caption } from "../components/Caption";
import { Highlight } from "../components/Highlight";
import { LAPTOP_OUTER, LaptopFrame } from "../components/LaptopFrame";
import { PHONE_ASPECT, PhoneFrame } from "../components/PhoneFrame";
import { DIRECT_PRICE_BADGE_03, PLATFORM_FEE_ROW_04 } from "../hotspots";
import { laptopCamera } from "../laptopShot";
import { StickerTag } from "../senja/StickerTag";
import { Surface } from "../senja/Surface";
import { settledTilt } from "../senja/tilt";
import { Vault } from "../senja/Vault";
import type { SceneComponent } from "./index";

/** Act 2 sits on Night. */
const SURFACE = "night";

/** Frame the badge ring lands in 2a — the tilt settles on it. */
const BADGE_AT = 72;

/**
 * 2a — storefront on the laptop. 16:9: the whole laptop on the vault right of
 * the caption, pushing in slowly. 9:16: the device area below the caption,
 * cropping from the whole laptop into the hero.
 */
const Scene2a: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const { width: W, height: H } = layout;
  const tilt = settledTilt(frame, BADGE_AT, 5, layout, 40);
  const highlight = <Highlight rect={DIRECT_PRICE_BADGE_03} startFrame={BADGE_AT} padding={5} />;

  if (layout.isPortrait) {
    // Device area: everything below the caption's top third.
    const area = { top: H * 0.34, height: H * 0.66 };
    const t = easedInterpolate(frame, [0, 120], [0, 1]);
    const camera = laptopCamera({ cx: 605, cy: 380, span: 1500, anchorY: 0.4 }, { cx: 330, cy: 230, span: 720, anchorY: 0.36 }, t, W);
    return (
      <Surface kind={SURFACE} glowFrom={24}>
        <Vault centerX={W * 0.5} top={H * 0.42} width={W * 0.88} />
        <div style={{ position: "absolute", left: 0, top: area.top, width: W, height: area.height, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, transform: `rotate(${tilt}deg)` }}>
            <Camera contentWidth={LAPTOP_OUTER.width} contentHeight={LAPTOP_OUTER.height} viewportWidth={W} viewportHeight={area.height} {...camera}>
              <LaptopFrame src={storyFlat("03-storefront-home")} width={LAPTOP_OUTER.width}>
                {highlight}
              </LaptopFrame>
            </Camera>
          </div>
        </div>
        <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
      </Surface>
    );
  }

  const laptopW = W * 0.48;
  const push = easedInterpolate(frame, [0, scene.durationInFrames], [1, 1.08]);
  const rise = easedInterpolate(frame, [0, 24], [1, 0]);

  return (
    <Surface kind={SURFACE} glowFrom={24}>
      <Vault centerX={W * 0.69} top={H * 0.26} width={W * 0.4} />
      <div
        style={{
          position: "absolute",
          left: W * 0.69 - laptopW / 2,
          top: H * 0.3,
          transform: `translateY(${rise * 24}px) scale(${push})`,
          transformOrigin: "30% 30%",
          opacity: 1 - rise,
        }}
      >
        <LaptopFrame src={storyFlat("03-storefront-home")} width={laptopW} tilt={tilt}>
          {highlight}
        </LaptopFrame>
      </div>
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

/** Where a phone can sit in 2b. Centre is the front layer; left/right sit back. */
type Slot = "offLeft" | "offRight" | "center" | "left" | "right";
type SlotPose = { x: number; scale: number; opacity: number; depth: number };

/** The phone stage: right 60% of the frame in 16:9, full width under the caption in 9:16. */
function getStage(layout: Layout) {
  const { width: W, height: H, isPortrait } = layout;
  return isPortrait
    ? { cx: W * 0.5, spread: W * 0.34, phoneW: W * 0.5, top: H * 0.37, back: 0.8 }
    : { cx: W * 0.7, spread: W * 0.17, phoneW: H * 0.36, top: H * 0.14, back: 0.84 };
}

function getSlotPose(slot: Slot, layout: Layout): SlotPose {
  const { cx, spread, back } = getStage(layout);
  const off = layout.width * 0.5;

  switch (slot) {
    case "center":
      return { x: cx, scale: 1, opacity: 1, depth: 1 };
    case "left":
      return { x: cx - spread, scale: back, opacity: 1, depth: 0.45 };
    case "right":
      return { x: cx + spread, scale: back, opacity: 1, depth: 0.45 };
    case "offLeft":
      return { x: cx - off, scale: back, opacity: 0, depth: 0.45 };
    case "offRight":
      return { x: cx + off, scale: back, opacity: 0, depth: 0.45 };
  }
}

/** Each phone's path: hold a slot, then ease to the next one over [from, to]. */
type Move = { from: number; to: number; slot: Slot };

/** Frame the Rp0 ring lands on 04 — the front phone's tilt settles on it, and the tag springs in. */
const RP0_AT = 36;

const PHONES: { screen: StoryScreen; start: Slot; moves: Move[]; restTilt: number }[] = [
  // 04 arrives centre first and carries the Rp0 highlight, then steps back left.
  { screen: "04-cart", start: "offLeft", moves: [{ from: 0, to: 30, slot: "center" }, { from: 98, to: 128, slot: "left" }], restTilt: -4 },
  // 05 takes the front as 04 steps back.
  { screen: "05-checkout", start: "offRight", moves: [{ from: 98, to: 128, slot: "center" }], restTilt: 0 },
  // 06 joins on the right.
  { screen: "06-order-success", start: "offRight", moves: [{ from: 122, to: 152, slot: "right" }], restTilt: 4 },
];

function getPose(frame: number, start: Slot, moves: Move[], layout: Layout): SlotPose {
  let pose = getSlotPose(start, layout);
  for (const move of moves) {
    const target = getSlotPose(move.slot, layout);
    const t = easedInterpolate(frame, [move.from, move.to], [0, 1]);
    pose = {
      x: pose.x + (target.x - pose.x) * t,
      scale: pose.scale + (target.scale - pose.scale) * t,
      opacity: pose.opacity + (target.opacity - pose.opacity) * t,
      depth: pose.depth + (target.depth - pose.depth) * t,
    };
  }
  return pose;
}

/** 2b — cart → checkout → success on three phones, middle in front, parallax drift. */
const Scene2b: SceneComponent = ({ scene }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const stage = getStage(layout);
  const phoneH = stage.phoneW * PHONE_ASPECT;
  // Slow lateral drift; the front layer moves further than the back.
  const drift = easedInterpolate(frame, [0, scene.durationInFrames], [-1, 1]) * layout.width * 0.012;
  const maxTilt = layout.isPortrait ? 3 : 7;

  return (
    <Surface kind={SURFACE} glowFrom={30}>
      <Vault
        centerX={stage.cx}
        top={layout.isPortrait ? layout.height * 0.46 : layout.height * 0.3}
        width={layout.isPortrait ? layout.width * 0.88 : layout.width * 0.46}
      />
      {PHONES.map((phone) => {
        const pose = getPose(frame, phone.start, phone.moves, layout);
        // The front phone (04 while it carries the ring) settles flat on RP0_AT;
        // phones in the back keep a small rest tilt, like cards on a table.
        const tilt =
          phone.screen === "04-cart"
            ? settledTilt(frame, RP0_AT, -6, layout, 30) + (phone.restTilt * maxTilt / 7) * easedInterpolate(frame, [98, 128], [0, 1])
            : (phone.restTilt * maxTilt) / 7;
        return (
          <div
            key={phone.screen}
            style={{
              position: "absolute",
              left: pose.x - stage.phoneW / 2 + drift * (0.5 + pose.depth),
              top: stage.top,
              opacity: pose.opacity,
              zIndex: Math.round(pose.scale * 10),
              transform: `scale(${pose.scale})`,
              transformOrigin: `50% ${phoneH * 0.45}px`,
            }}
          >
            <PhoneFrame src={storyFlat(phone.screen)} width={stage.phoneW} tilt={tilt}>
              {phone.screen === "04-cart" ? <Highlight rect={PLATFORM_FEE_ROW_04} startFrame={RP0_AT} endFrame={90} /> : null}
            </PhoneFrame>
          </div>
        );
      })}
      <StickerTag
        text="Rp0 potongan"
        x={stage.cx + stage.phoneW * 0.28}
        y={stage.top + phoneH * 0.74}
        rotate={-5}
        startFrame={RP0_AT + 6}
        endFrame={98}
      />
      <Caption text={scene.caption} startFrame={8} endFrame={scene.durationInFrames} />
    </Surface>
  );
};

export const ACT2_SCENES = { "2a": Scene2a, "2b": Scene2b };
