import { AbsoluteFill, useCurrentFrame } from "remotion";
import { cameraAt, worldToScreen, type CameraKeyframe } from "./camera";
import { FOCAL, MOTION, REEL, SAFE_ZONE } from "./tokens";
import type { Box, SentenceLayout } from "./wordLayout";

/** A sentence as the check sees it. Frames are local to the scene. */
export type SentenceCheck = {
  id: string;
  /** Where the scene starts on the reel, so reported frames are absolute. */
  sceneStart: number;
  layout: SentenceLayout;
  keyframes: readonly CameraKeyframe[];
  starts: readonly number[];
  holdStart: number;
  holdEnd: number;
  /** A shorter agreed hold for this sentence; defaults to holdMin. */
  minHold?: number;
};

/** Anything else that must stay readable: a box per frame, tested from..to (local frames). */
export type BoxCheck = {
  id: string;
  sceneStart: number;
  keyframes: readonly CameraKeyframe[];
  from: number;
  to: number;
  boxAt: (frame: number) => Box;
  /** "frame" only requires staying on screen, for things not being read right now. */
  area?: "safe" | "frame";
};

function isInsideSafeZone(box: Box): boolean {
  // Half a pixel of tolerance: the camera clamps to the edge exactly, and rounding shouldn't count as a miss.
  const tolerance = 0.5;
  return (
    box.x >= SAFE_ZONE.left - tolerance &&
    box.x + box.width <= SAFE_ZONE.right + tolerance &&
    box.y >= SAFE_ZONE.top - tolerance &&
    box.y + box.height <= SAFE_ZONE.bottom + tolerance
  );
}

const describe = (box: Box) =>
  `x ${box.x.toFixed(0)}–${(box.x + box.width).toFixed(0)}, y ${box.y.toFixed(0)}–${(box.y + box.height).toFixed(0)}`;

/** Every problem in one sentence: hold too short, or anything being read outside the safe zone. */
export function checkSentence(check: SentenceCheck): string[] {
  const { id, sceneStart, layout, keyframes, starts, holdStart, holdEnd } = check;
  const problems: string[] = [];
  const absolute = (frame: number) => frame + sceneStart;

  const holdLength = holdEnd - holdStart;
  const minHold = check.minHold ?? MOTION.holdMin;
  if (holdLength < minHold) {
    problems.push(`${id}: hold is ${holdLength} f, minimum ${minHold}`);
  }

  for (let frame = holdStart; frame <= holdEnd; frame++) {
    const screen = worldToScreen(layout.box, cameraAt(keyframes, frame));
    if (!isInsideSafeZone(screen)) {
      problems.push(`${id}: sentence outside safe zone at frame ${absolute(frame)} (${describe(screen)})`);
      break;
    }
  }

  layout.words.forEach((word, index) => {
    // A word is "being read" until the next one starts entering.
    const last = index + 1 < starts.length ? starts[index + 1] - 1 : holdStart;
    for (let frame = Math.max(0, starts[index]); frame <= last; frame++) {
      const screen = worldToScreen(word, cameraAt(keyframes, frame));
      if (!isInsideSafeZone(screen)) {
        problems.push(`${id}: "${word.text}" outside safe zone at frame ${absolute(frame)} (${describe(screen)})`);
        break;
      }
    }
  });

  return problems;
}

export function checkBox(check: BoxCheck): string[] {
  for (let frame = check.from; frame <= check.to; frame++) {
    const screen = worldToScreen(check.boxAt(frame), cameraAt(check.keyframes, frame));
    if (check.area === "frame") {
      if (screen.x < 0 || screen.y < 0 || screen.x + screen.width > REEL.width || screen.y + screen.height > REEL.height) {
        return [`${check.id}: cropped by the frame at frame ${frame + check.sceneStart} (${describe(screen)})`];
      }
    } else if (!isInsideSafeZone(screen)) {
      return [`${check.id}: outside safe zone at frame ${frame + check.sceneStart} (${describe(screen)})`];
    }
  }
  return [];
}

const reported = new Set<string>();

export function reportBoxChecks(checks: readonly BoxCheck[]): void {
  checks.forEach((check) => {
    if (reported.has(check.id)) {
      return;
    }
    reported.add(check.id);
    const problems = checkBox(check);
    problems.forEach((problem) => console.warn(`[safe-zone] ${problem}`));
    if (problems.length === 0) {
      console.log(`[safe-zone] ${check.id}: OK, frames ${check.from + check.sceneStart}–${check.to + check.sceneStart}`);
    }
  });
}

/** Logs once per sentence. Pass the same checks the scene renders with. */
export function reportSentenceChecks(checks: readonly SentenceCheck[]): void {
  checks.forEach((check) => {
    if (reported.has(check.id)) {
      return;
    }
    reported.add(check.id);
    const problems = checkSentence(check);
    const { box } = check.layout;
    const hold = `hold ${check.holdStart + check.sceneStart}–${check.holdEnd + check.sceneStart}`;
    const text = check.layout.words.map((word) => word.text).join(" ");
    // Only this sentence's own build and pull-back; shared-world pans would swamp it.
    let maxStep = 0;
    for (let frame = check.starts[0] + 1; frame <= check.holdStart; frame++) {
      const from = cameraAt(check.keyframes, frame - 1);
      const to = cameraAt(check.keyframes, frame);
      maxStep = Math.max(maxStep, Math.hypot(to.x - from.x, to.y - from.y) * to.s);
    }
    console.log(`[safe-zone] ${check.id}: "${text}", fastest camera step ${maxStep.toFixed(0)} px/frame`);
    problems.forEach((problem) => console.warn(`[safe-zone] ${problem}`));
    if (problems.length === 0) {
      console.log(`[safe-zone] ${check.id}: OK, ${box.width.toFixed(0)} px wide, ${hold}`);
    }
  });
}

/** Screen-space overlay: safe zone, focal point, and the live box of each sentence. */
export const SafeZoneOverlay: React.FC<{ checks?: readonly SentenceCheck[] }> = ({ checks = [] }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: SAFE_ZONE.left,
          top: SAFE_ZONE.top,
          width: SAFE_ZONE.right - SAFE_ZONE.left,
          height: SAFE_ZONE.bottom - SAFE_ZONE.top,
          boxSizing: "border-box",
          border: "3px dashed rgba(0,140,255,.8)",
        }}
      />
      <div style={{ position: "absolute", left: FOCAL.x - 30, top: FOCAL.y - 1, width: 60, height: 2, background: "rgba(0,140,255,.9)" }} />
      <div style={{ position: "absolute", left: FOCAL.x - 1, top: FOCAL.y - 30, width: 2, height: 60, background: "rgba(0,140,255,.9)" }} />
      {checks.map((check) => {
        if (frame < check.starts[0] || frame > check.holdEnd) {
          return null;
        }
        const screen = worldToScreen(check.layout.box, cameraAt(check.keyframes, frame));
        return (
          <div
            key={check.id}
            style={{
              position: "absolute",
              left: screen.x,
              top: screen.y,
              width: screen.width,
              height: screen.height,
              boxSizing: "border-box",
              border: `2px solid ${isInsideSafeZone(screen) ? "rgba(0,170,90,.9)" : "rgba(230,0,60,.9)"}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
