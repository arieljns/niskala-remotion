import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { MistBackground, NightBackground } from "../Backgrounds";
import { Camera, fitCamera, sentenceCamera, World, type CameraKeyframe } from "../camera";
import type { BoxCheck } from "../debug";
import { ExitText } from "../ExitText";
import { LebayWord, SLAM_LANDS, slamScale } from "../LebayWord";
import { Shake } from "../Shake";
import { COLORS, FOCAL, MOTION, TYPE } from "../tokens";
import { WordBuild } from "../WordBuild";
import { layoutSentence, scaleBox } from "../wordLayout";
import { timedCheck, type TimedCheck } from "./timedCheck";
import { WORD_TIMES } from "./copy";
import { CAMERA_SETTLE, fitToHold, PHRASE_HANDOVER, voiceStarts, type HookVariant, type SceneTiming } from "./timeline";

const HOOK_LINES = ["~~Jangan biarin~~", "__toko kamu__", "**mati** ~~di~~ __2027.__"] as const;
const QUESTION_LINES = ["~~Kamu jualan~~", "~~di~~ __marketplace?__"] as const;

/** Mid-entrance on frame 0, so the reel never opens on a still or empty frame. */
const OPENING_START = -4;
const STOP_FONT_SIZE = 300;
/** Already falling on frame 0, so the reel opens mid-slam. */
const SLAM_START = -2;
/** Where the word hits: on the voice's "STOP". */
const STOP_IMPACT = SLAM_START + SLAM_LANDS;
/** Heavy, then dying away. */
const STOP_SHAKE = [
  [30, -22],
  [-26, 20],
  [20, -14],
  [-14, 11],
  [9, -6],
  [-5, 3],
] as const;
const FLASH_FRAMES = 5;
const RING_FRAMES = 18;
const RING_SIZE = 1500;
const STOP_PEAK_SCALE = 1.07;
/** Keeps the rebound and the shake 60 px inside the safe zone. */
const STOP_SIZE = 0.815;
const STOP_MARGIN = 60;
const HANDOVER = 14;
/** Just inside the 876 px safe width. */
const HOOK_WIDTH = 860;
/**
 * At this size a full line nearly fills the safe zone, so at the usual 1.3 zoom
 * one line's end and the next line's start can't both stay inside and the
 * camera has to jump. A gentler zoom and sweep keep it a glide.
 */
const HOOK_FOLLOW = 0.3;
const HOOK_FOLLOW_ZOOM = 1.08;

const hookLayout = () => {
  // Sized from its own longest line, so it fills the safe width at full zoom.
  const base = layoutSentence({ lines: HOOK_LINES, style: TYPE.hook, center: FOCAL });
  const fontSize = Math.floor((TYPE.hook.fontSize * HOOK_WIDTH) / base.box.width);
  return layoutSentence({ lines: HOOK_LINES, style: { ...TYPE.hook, fontSize }, center: FOCAL });
};

export function useS1Hook(variant: HookVariant, scene: SceneTiming) {
  return useMemo(() => {
    const hook = hookLayout();

    if (variant === "plain") {
      const gap = MOTION.wordGap;
      const camera = sentenceCamera({
        layout: hook,
        startFrame: OPENING_START,
        followAmount: HOOK_FOLLOW,
        followZoom: HOOK_FOLLOW_ZOOM,
      });
      const check = timedCheck({
        id: "S1 hook plain",
        scene,
        cue: scene.cues[0],
        layout: hook,
        keyframes: camera.keyframes,
        starts: camera.starts,
        holdStart: camera.holdStart,
        holdEnd: scene.durationInFrames,
      });
      return {
        stop: null,
        question: null,
        hook,
        hookStart: OPENING_START,
        hookGap: gap,
        keyframes: camera.keyframes,
        sentenceChecks: [check] as TimedCheck[],
        boxChecks: [] as BoxCheck[],
      };
    }

    /* ---------- layout ---------- */
    const stop = layoutSentence({
      lines: ["STOP."],
      style: { ...TYPE.punch, fontSize: STOP_FONT_SIZE },
      center: FOCAL,
    });
    const question = layoutSentence({ lines: QUESTION_LINES, style: TYPE.sentence, center: FOCAL });

    /* ---------- timing ---------- */
    const hookGap = fitToHold(voiceStarts(scene, WORD_TIMES.s1Hook), scene.durationInFrames, CAMERA_SETTLE);
    const hookStart = hookGap[0];
    const questionOut = hookStart - PHRASE_HANDOVER;
    const questionGap = fitToHold(voiceStarts(scene, WORD_TIMES.s1Question), questionOut, CAMERA_SETTLE);
    const questionStart = questionGap[0];
    // A hard cut on the voice's next word, not a fade: STOP holds at full strength until the Mist replaces it.
    const stopOut = scene.cues[1];

    /* ---------- camera: pulled back so the 300 px word fits at its overshoot ---------- */
    const stopFit = fitCamera(scaleBox(stop.box, STOP_PEAK_SCALE));
    const stopCamera = { ...stopFit, s: stopFit.s * STOP_SIZE };
    const questionCamera = sentenceCamera({
      layout: question,
      startFrame: questionStart,
      gap: questionGap,
    });
    const hookCamera = sentenceCamera({
      layout: hook,
      startFrame: hookStart,
      gap: hookGap,
      followAmount: HOOK_FOLLOW,
      followZoom: HOOK_FOLLOW_ZOOM,
      enter: { from: fitCamera(question.box), frame: questionOut, duration: HANDOVER },
    });
    const keyframes: CameraKeyframe[] = [
      { frame: 0, ...stopCamera },
      { frame: stopOut - 1, ...stopCamera, ease: "linear" },
      // The camera cuts with the picture, so the question is already at reading size.
      ...questionCamera.keyframes.filter((keyframe) => keyframe.frame >= stopOut),
      ...hookCamera.keyframes,
    ];

    /* ---------- dev checks ---------- */
    /* Readable once the flash clears. */
    const stopSettled = STOP_IMPACT + FLASH_FRAMES - 3;
    const sentenceChecks: TimedCheck[] = [
      timedCheck({
        id: "S1 STOP.",
        scene,
        cue: scene.cues[0],
        layout: stop,
        keyframes,
        starts: [SLAM_START],
        holdStart: stopSettled,
        holdEnd: stopOut - 1,
      }),
      timedCheck({
        id: "S1 question",
        scene,
        cue: scene.cues[1],
        layout: question,
        keyframes,
        starts: questionCamera.starts,
        holdStart: questionCamera.holdStart,
        holdEnd: questionOut,
      }),
      timedCheck({
        id: "S1 hook",
        scene,
        cue: scene.cues[2],
        layout: hook,
        keyframes,
        starts: hookCamera.starts,
        holdStart: hookCamera.holdStart,
        holdEnd: scene.durationInFrames,
      }),
    ];
    const boxChecks: BoxCheck[] = [
      {
        id: "S1 STOP. including overshoot",
        sceneStart: scene.from,
        keyframes,
        from: STOP_IMPACT,
        to: stopOut - 1,
        boxAt: (frame) => {
          const box = scaleBox(stop.box, slamScale(frame - SLAM_START));
          const shake = STOP_SHAKE[frame - STOP_IMPACT];
          // Shaken, with the margin as padding: the check's limit is the safe-zone edge.
          const padX = (STOP_MARGIN + Math.abs(shake?.[0] ?? 0)) / stopCamera.s;
          const padY = Math.abs(shake?.[1] ?? 0) / stopCamera.s;
          return { x: box.x - padX, y: box.y - padY, width: box.width + padX * 2, height: box.height + padY * 2 };
        },
      },
    ];

    return { stop, stopImpact: STOP_IMPACT, question, stopOut, questionStart, questionOut, questionGap, hook, hookStart, hookGap, keyframes, sentenceChecks, boxChecks };
  }, [scene, variant]);
}

/** The impact, in screen space: a shockwave under the word, a flash over everything. */
const StopImpact: React.FC<{ layer: "ring" | "flash" }> = ({ layer }) => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  if (layer === "flash") {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.cream,
          opacity: interpolate(frame, [STOP_IMPACT - 1, STOP_IMPACT, STOP_IMPACT + FLASH_FRAMES], [0, 0.9, 0], clamp),
        }}
      />
    );
  }
  const progress = interpolate(frame, [STOP_IMPACT, STOP_IMPACT + RING_FRAMES], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return frame < STOP_IMPACT || progress >= 1 ? null : (
    <div
      style={{
        position: "absolute",
        left: FOCAL.x - RING_SIZE / 2,
        top: FOCAL.y - RING_SIZE / 2,
        width: RING_SIZE,
        height: RING_SIZE,
        borderRadius: "50%",
        border: `${interpolate(progress, [0, 1], [90, 4])}px solid ${COLORS.accent}`,
        boxSizing: "border-box",
        opacity: 1 - progress,
        scale: String(interpolate(progress, [0, 1], [0.2, 1.1])),
      }}
    />
  );
};

export const S1Hook: React.FC<{ hook: ReturnType<typeof useS1Hook> }> = ({ hook }) => {
  const frame = useCurrentFrame();
  const stopping = hook.stop !== null && frame < hook.stopOut;

  return (
    <>
      {/* The stage's own colour, so a shaking stage never shows an edge. */}
      <AbsoluteFill style={{ backgroundColor: stopping ? COLORS.night : COLORS.mist }} />
      <Shake at={hook.stop ? [STOP_IMPACT] : []} offsets={STOP_SHAKE}>
        {stopping ? <NightBackground /> : <MistBackground />}
        {stopping ? <StopImpact layer="ring" /> : null}
        <Camera keyframes={hook.keyframes}>
          <World>
            {stopping && hook.stop ? <LebayWord layout={hook.stop} preset="slam" startFrame={SLAM_START} /> : null}
            {hook.question ? (
              <ExitText startFrame={hook.questionOut}>
                <WordBuild layout={hook.question} startFrame={hook.questionStart} gap={hook.questionGap} />
              </ExitText>
            ) : null}
            <WordBuild layout={hook.hook} startFrame={hook.hookStart} gap={hook.hookGap} />
          </World>
        </Camera>
      </Shake>
      {/* Outside the shake, so its edge never shows. */}
      {stopping ? <StopImpact layer="flash" /> : null}
    </>
  );
};
