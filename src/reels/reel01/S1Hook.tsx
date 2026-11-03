import { useMemo } from "react";
import { Camera, sentenceCamera, World } from "../camera";
import type { SentenceCheck } from "../debug";
import { FOCAL, TYPE } from "../tokens";
import { WordBuild } from "../WordBuild";
import { layoutSentence } from "../wordLayout";
import { SCENES } from "./timeline";

export type HookVariant = "A" | "B" | "C";

const HOOK_LINES: Record<HookVariant, readonly string[]> = {
  A: ["~~Jangan biarin~~", "__toko kamu__", "**mati** ~~di~~ __2027.__"],
  B: ["~~Toko online kamu~~", "~~kerja buat~~ **siapa**?"],
  C: ["~~Gak ikut~~ __promo?__", "~~Toko kamu~~ **tenggelam**."],
};

/** Starts before the scene so frame 0 already shows the first word moving. */
const START_FRAME = -4;
/** Just inside the 876 px safe width. */
const HOOK_WIDTH = 860;
/**
 * At this size a full line nearly fills the safe zone, so at the usual 1.3 zoom
 * one line's end and the next line's start can't both stay inside and the
 * camera has to jump. A gentler zoom and sweep keep it a glide.
 */
const HOOK_FOLLOW = 0.3;
const HOOK_FOLLOW_ZOOM = 1.08;

export function useS1Hook(variant: HookVariant) {
  return useMemo(() => {
    // Sized from its own longest line, so every variant fills the safe width at full zoom.
    const base = layoutSentence({ lines: HOOK_LINES[variant], style: TYPE.hook, center: FOCAL });
    const fontSize = Math.floor((TYPE.hook.fontSize * HOOK_WIDTH) / base.box.width);
    const layout = layoutSentence({ lines: HOOK_LINES[variant], style: { ...TYPE.hook, fontSize }, center: FOCAL });
    const { keyframes, starts, holdStart } = sentenceCamera({ layout, startFrame: START_FRAME, followAmount: HOOK_FOLLOW, followZoom: HOOK_FOLLOW_ZOOM });
    const check: SentenceCheck = {
      id: `S1 hook ${variant}`,
      sceneStart: SCENES.s1.from,
      layout,
      keyframes,
      starts,
      holdStart,
      holdEnd: SCENES.s1.durationInFrames,
    };
    return { layout, keyframes, check };
  }, [variant]);
}

export const S1Hook: React.FC<{ hook: ReturnType<typeof useS1Hook> }> = ({ hook }) => (
  <Camera keyframes={hook.keyframes}>
    <World>
      <WordBuild layout={hook.layout} startFrame={START_FRAME} />
    </World>
  </Camera>
);
