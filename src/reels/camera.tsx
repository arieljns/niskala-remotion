import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Camera as StoryCamera } from "./CameraCore";
import { CAMERA_ZOOM, EASINGS, FOCAL, MOTION, REEL, SAFE_ZONE } from "./tokens";
import { wordTiming, type WordPace } from "./WordBuild";
import type { Box, SentenceLayout } from "./wordLayout";

/** `ease` shapes the segment arriving at this keyframe; easeCamera by default. */
export type CameraKeyframe = {
  frame: number;
  x: number;
  y: number;
  s: number;
  ease?: "camera" | "linear";
};
export type CameraState = { x: number; y: number; s: number };

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** Pure so the safe-zone check can sample the same path the render uses. */
export function cameraAt(keyframes: readonly CameraKeyframe[], frame: number): CameraState {
  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];
  if (frame <= first.frame) {
    return first;
  }
  if (frame >= last.frame) {
    return last;
  }
  const nextIndex = keyframes.findIndex((keyframe) => keyframe.frame > frame);
  const from = keyframes[nextIndex - 1];
  const to = keyframes[nextIndex];
  const linear = (frame - from.frame) / (to.frame - from.frame);
  const t = to.ease === "linear" ? linear : EASINGS.camera(linear);
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t), s: lerp(from.s, to.s, t) };
}

export function useCamera(keyframes: readonly CameraKeyframe[]): CameraState {
  return cameraAt(keyframes, useCurrentFrame());
}

/** Largest zoom (capped at 1) that fits a box inside the safe zone. */
export function fitZoom(box: Pick<Box, "width" | "height">): number {
  return Math.min(
    CAMERA_ZOOM.fitMax,
    (SAFE_ZONE.right - SAFE_ZONE.left) / box.width,
    (SAFE_ZONE.bottom - SAFE_ZONE.top) / box.height,
  );
}

/** Centres a box on the focal point at the zoom that fits it. */
export function fitCamera(box: Box, zoom: number = fitZoom(box)): CameraState {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, s: zoom };
}

export function worldToScreen(box: Box, camera: CameraState): Box {
  return {
    x: FOCAL.x + (box.x - camera.x) * camera.s,
    y: FOCAL.y + (box.y - camera.y) * camera.s,
    width: box.width * camera.s,
    height: box.height * camera.s,
  };
}

/** Screen px kept clear of the safe-zone edge, so blending into a pull-back can't tip a word over it. */
const CLAMP_MARGIN = 4;
const FOLLOW_SMOOTHING_RADIUS = 3;
const FOLLOW_SMOOTHING_PASSES = 10;

function smooth(values: readonly number[]): number[] {
  return values.map((_, index) => {
    let total = 0;
    for (let offset = -FOLLOW_SMOOTHING_RADIUS; offset <= FOLLOW_SMOOTHING_RADIUS; offset++) {
      total += values[Math.min(values.length - 1, Math.max(0, index + offset))];
    }
    return total / (FOLLOW_SMOOTHING_RADIUS * 2 + 1);
  });
}

/**
 * The camera for a sentence: glide along the words at follow zoom, then pull
 * back to fit. The reading path joins word centres in time, then alternates
 * smoothing with clamping so it sways gently instead of snapping word to word
 * while the newest word always stays inside the safe zone. The pull-back
 * blends out of that moving path rather than starting from a stop, so the two
 * moves read as one. One keyframe per frame keeps it all in the same format as
 * hand-written moves.
 */
export function sentenceCamera({
  layout,
  startFrame,
  gap = MOTION.wordGap,
  pullStart: pullStartOverride,
  target: targetOverride,
  enter,
  followAmount = 1,
  followZoom = CAMERA_ZOOM.follow,
}: {
  layout: SentenceLayout;
  startFrame: number;
  gap?: WordPace;
  /** Start the move out of the follow earlier than the default overlap. */
  pullStart?: number;
  /** End framing, when it should hold more than the sentence itself. */
  target?: CameraState;
  /** Arrive from another shot, blending into the reading path. */
  enter?: { from: CameraState; frame: number; duration: number };
  /** 1 centres each word; lower narrows the sweep, for when something else must stay on screen. */
  followAmount?: number;
  /** Zoom while following. Type too wide for the safe zone at 1.3 needs less, or the camera has to jump. */
  followZoom?: number;
}): { keyframes: CameraKeyframe[]; starts: number[]; settled: number; holdStart: number } {
  const { starts, settled } = wordTiming(layout, startFrame, gap);
  const { words } = layout;
  const pullStart = pullStartOverride ?? settled - MOTION.pullBackOverlap;
  const holdStart = pullStart + MOTION.pullBack;

  const frames: number[] = [];
  for (let frame = enter ? enter.frame : startFrame; frame <= holdStart; frame++) {
    frames.push(frame);
  }

  const newestWordAt = (frame: number) => {
    let newest = words[0];
    starts.forEach((start, index) => {
      if (start <= frame) {
        newest = words[index];
      }
    });
    return newest;
  };

  /** Camera positions at follow zoom that keep `low..high` inside the safe zone. */
  const clampAxis = (value: number, low: number, high: number, safeLow: number, safeHigh: number, focal: number) =>
    Math.min(
      low + (focal - safeLow - CLAMP_MARGIN) / followZoom,
      Math.max(high - (safeHigh - focal - CLAMP_MARGIN) / followZoom, value),
    );

  const clampX = (value: number, frame: number) => {
    const word = newestWordAt(frame);
    return clampAxis(value, word.x, word.x + word.width, SAFE_ZONE.left, SAFE_ZONE.right, FOCAL.x);
  };
  const clampY = (value: number, frame: number) => {
    const word = newestWordAt(frame);
    return clampAxis(value, word.y, word.y + word.height, SAFE_ZONE.top, SAFE_ZONE.bottom, FOCAL.y);
  };

  const sentenceCenter = fitCamera(layout.box);
  let xs = frames.map((frame) =>
    lerp(sentenceCenter.x, newestWordAt(frame).x + newestWordAt(frame).width / 2, followAmount),
  );
  let ys = frames.map((frame) =>
    lerp(sentenceCenter.y, newestWordAt(frame).y + newestWordAt(frame).height / 2, followAmount),
  );
  for (let pass = 0; pass < FOLLOW_SMOOTHING_PASSES; pass++) {
    xs = smooth(xs).map((value, index) => clampX(value, frames[index]));
    ys = smooth(ys).map((value, index) => clampY(value, frames[index]));
  }

  const target = targetOverride ?? fitCamera(layout.box);

  const keyframes: CameraKeyframe[] = frames.map((frame, index) => {
    const t = EASINGS.camera(Math.min(1, Math.max(0, (frame - pullStart) / MOTION.pullBack)));
    const inside = enter ? EASINGS.camera(Math.min(1, Math.max(0, (frame - enter.frame) / enter.duration))) : 1;
    const followX = enter ? lerp(enter.from.x, xs[index], inside) : xs[index];
    const followY = enter ? lerp(enter.from.y, ys[index], inside) : ys[index];
    const followS = enter ? lerp(enter.from.s, followZoom, inside) : followZoom;
    const zoom = lerp(followS, target.s, t);
    let x = lerp(followX, target.x, t);
    // Mid pull-back the zoom is changing, so re-apply the newest word's limit at this frame's zoom.
    if (frame >= pullStart) {
      const word = newestWordAt(frame);
      // The margin fades out, so a sentence that fills the safe width still lands exactly centred.
      const margin = CLAMP_MARGIN * (1 - t);
      x = Math.min(
        word.x + (FOCAL.x - SAFE_ZONE.left - margin) / zoom,
        Math.max(word.x + word.width - (SAFE_ZONE.right - FOCAL.x - margin) / zoom, x),
      );
    }
    return { frame, x, y: lerp(followY, target.y, t), s: zoom, ease: "linear" };
  });

  return { keyframes, starts, settled, holdStart };
}

/** Holds all scene content, in world coordinates. */
export const World: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      overflow: "visible",
      translate: "-22.6px 65.5px",
    }}
  >{children}</AbsoluteFill>
);

/**
 * Lands the camera's world point on the focal point. Backgrounds and shake
 * stay outside this. Keyframes are read here (not passed as state) so motion
 * blur can later re-evaluate the camera at sub-frame times.
 */
export const Camera: React.FC<{ keyframes: readonly CameraKeyframe[]; children: React.ReactNode }> = ({
  keyframes,
  children,
}) => {
  const camera = useCamera(keyframes);
  const anchor = useMemo(() => ({ x: FOCAL.x / REEL.width, y: FOCAL.y / REEL.height }), []);

  return (
    <StoryCamera
      contentWidth={REEL.width}
      contentHeight={REEL.height}
      focusX={camera.x}
      focusY={camera.y}
      scale={camera.s}
      anchorX={anchor.x}
      anchorY={anchor.y}
    >
      {children}
    </StoryCamera>
  );
};
