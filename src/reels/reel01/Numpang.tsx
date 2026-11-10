import { CameraMotionBlur } from "@remotion/motion-blur";
import { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { NightBackground } from "../Backgrounds";
import { Camera, cameraAt, World, worldToScreen, type CameraKeyframe, type CameraState } from "../camera";
import type { BoxCheck } from "../debug";
import { COLORS, EASINGS, FOCAL, REEL, SAFE_ZONE, SHADOWS } from "../tokens";
import { FONTS } from "../../theme/fonts";
import { S2_LINE } from "./copy";
import { buildHeadlines, Headline } from "./Headlines";
import { HERO_TILE, StoreTileGrid, TILE } from "./StoreTileGrid";
import type { SceneTiming } from "./timeline";

/** Where the voice reaches "selama ini": from here the store is shown for what it is. */
const REVEAL_SECONDS = 2.1;
const PULL_FRAMES = 45;
/** The hero fills 60% of the safe width. */
const HERO_ZOOM = ((SAFE_ZONE.right - SAFE_ZONE.left) * 0.6) / TILE.width;
const DRIFT = 1.03;
/** At this zoom the 24 x 40 grid still covers the frame, and the hero is about 44 px wide. */
const FAR_ZOOM = 0.2;
const HOLD_DRIFT = 1.03;
const MOTION_BLUR = { shutterAngle: 180, samples: 5 } as const;
/** Three lines, from the top of the safe zone. */
const TEXT_CENTER = { x: FOCAL.x, y: 360 };
const VIGNETTE_FRAMES = 10;
const LABEL_FRAMES = 8;
const LABEL_GAP = 16;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** v1's flicker placement, frames after the last word settles. It starts once the camera and the tiles have finished. */
const FLICKER_AFTER = 2;

/** S2's camera: on the hero tile, then one long pull-back to a tiny tile in a huge grid. */
export function useNumpang(scene: SceneTiming) {
  return useMemo(() => {
    const pullStart = scene.voFrom + Math.round(REVEAL_SECONDS * REEL.fps);
    const pullEnd = pullStart + PULL_FRAMES;
    const on = (s: number): CameraState => ({ x: FOCAL.x, y: FOCAL.y, s });
    const keyframes: CameraKeyframe[] = [
      { frame: 0, ...on(HERO_ZOOM) },
      { frame: pullStart, ...on(HERO_ZOOM * DRIFT), ease: "linear" },
      { frame: pullEnd, ...on(FAR_ZOOM) },
      { frame: scene.durationInFrames, ...on(FAR_ZOOM * HOLD_DRIFT), ease: "linear" },
    ];
    const [line] = buildHeadlines([{ scene, offset: 0, lines: S2_LINE.lines, at: S2_LINE.at, center: TEXT_CENTER }]);
    const boxChecks: BoxCheck[] = [
      {
        id: "S2 hero tile stays on screen",
        sceneStart: scene.from,
        keyframes,
        from: 0,
        to: scene.durationInFrames,
        boxAt: () => HERO_TILE,
      },
    ];
    return { pullStart, pullEnd, keyframes, line, checks: [line.check], boxChecks, settled: line.check.holdStart };
  }, [scene]);
}

/** Night, a store that looks big, then the truth about how big it is. */
export const Numpang: React.FC<{ numpang: ReturnType<typeof useNumpang> }> = ({ numpang }) => {
  const frame = useCurrentFrame();
  const { pullStart, pullEnd, keyframes, line, settled } = numpang;
  const stage = (
    <>
      <NightBackground />
      <Camera keyframes={keyframes}>
        <World>
          <StoreTileGrid keyframes={keyframes} pullStart={pullStart} pullEnd={pullEnd} />
        </World>
      </Camera>
    </>
  );
  const flickerFrom = settled + FLICKER_AFTER;
  const flicker = [0, 1, 2, 3, 4].map((step) => flickerFrom + step);
  const heroBox = worldToScreen(HERO_TILE, cameraAt(keyframes, frame));
  const label = interpolate(frame, [pullEnd, pullEnd + LABEL_FRAMES], [0, 1], { ...clamp, easing: EASINGS.brand });

  return (
    <AbsoluteFill>
      {frame >= pullStart && frame < pullEnd ? (
        <CameraMotionBlur shutterAngle={MOTION_BLUR.shutterAngle} samples={MOTION_BLUR.samples}>
          {stage}
        </CameraMotionBlur>
      ) : (
        stage
      )}
      {/* Keeps the sentence readable over the tiles, whatever is passing under it. */}
      <AbsoluteFill
        style={{
          opacity: interpolate(frame, [pullStart, pullStart + VIGNETTE_FRAMES], [0, 1], clamp),
          background: `linear-gradient(180deg, ${COLORS.night} 0, ${COLORS.night} 500px, rgba(20,12,18,.72) 560px, rgba(20,12,18,0) 700px)`,
        }}
      />
      {label > 0 ? (
        <div
          style={{
            position: "absolute",
            left: FOCAL.x - 120,
            width: 240,
            top: heroBox.y + heroBox.height + LABEL_GAP,
            textAlign: "center",
            fontFamily: FONTS.body,
            fontWeight: 600,
            fontSize: 26,
            color: COLORS.cream,
            opacity: label,
            textShadow: `0 0 12px ${COLORS.night}, 0 0 4px ${COLORS.night}`,
          }}
        >
          toko kamu
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, flicker, [1, 0.35, 1, 0.6, 1], clamp),
        }}
      >
        <Headline line={line} color={COLORS.cream} textShadow={SHADOWS.creamGlow} accentTextShadow={SHADOWS.accentGlow} />
      </div>
    </AbsoluteFill>
  );
};
