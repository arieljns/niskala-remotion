import { useEffect, useMemo } from "react";
import { getRemotionEnvironment, Sequence } from "remotion";
import { MistBackground } from "../Backgrounds";
import { reportBoxChecks, reportSentenceChecks, SafeZoneOverlay } from "../debug";
import { useReelFonts } from "../useReelFonts";
import { Numpang, useNumpang } from "./Numpang";
import { MusicTrack, SfxTrack, VoTrack, type SfxCue } from "./audio";
import { BlackBeat, useBlackBeat } from "./BlackBeat";
import { buildCopy } from "./copy";
import type { ReelSpec } from "../contract/spec.schema";
import type { ReelTiming } from "../contract/timing-types";
import reel01Timing from "../specs/_golden/reel01.timing.json";
import { spec as reel01Spec } from "../specs/_golden/reel01";
import { Cta, useCta } from "./Cta";
import { PhoneFlow, usePhoneFlow } from "./PhoneFlow";
import { Reasons, useReasons } from "./Reasons";
import { S1Hook, useS1Hook } from "./S1Hook";
import { Solution, useSolution } from "./Solution";
import { MOTION_REPORT_MARKER } from "../contract/motion-types";
import { buildMotionReport } from "./motionReport";
import { reportTiming } from "./timedCheck";
import { buildTimeline, type ReelTimeline } from "./timeline";

export type Reel01Props = {
  /** All on-screen copy and the hook variant. Style, motion and screens are the kit's, from Reel01. */
  spec: ReelSpec;
  /** Voice-over files, cues and word times (<id>.timing.json). Written by reel:cues, never typed. */
  timing: ReelTiming;
  debugSafeZone: boolean;
  /** Filled in by calculateReel01Metadata from the real VO files. */
  timeline: ReelTimeline | null;
};

export const REEL01_DEFAULT_PROPS: Reel01Props = {
  spec: reel01Spec,
  timing: reel01Timing as ReelTiming,
  debugSafeZone: false,
  timeline: null,
};

/** v1's flicker placement: frames after the last word settles. */
export const S6_FLICKER_AFTER = 5;

/** Text is measured during render, so nothing below may mount before the fonts load. */
export const Reel01: React.FC<Reel01Props> = (props) => {
  const fontsReady = useReelFonts();
  return fontsReady ? <Reel01Scenes {...props} /> : null;
};

const Reel01Scenes: React.FC<Reel01Props> = ({ spec, timing, debugSafeZone, timeline: timelineProp }) => {
  const hookVariant = spec.hookVariant;
  const copy = useMemo(() => buildCopy(spec, timing), [spec, timing]);
  const timeline = useMemo(() => timelineProp ?? buildTimeline(hookVariant, timing), [hookVariant, timing, timelineProp]);
  const { scenes } = timeline;

  const hook = useS1Hook(hookVariant, scenes.s1, copy.hook);
  const s2 = useNumpang(scenes.s2, copy.numpang);
  const reasons = useReasons({ s3: scenes.s3, s4: scenes.s4, s5: scenes.s5, copy });
  const s6 = useBlackBeat({ id: "S6 black beat", phrases: copy.blackBeats.s6, scene: scenes.s6 });
  const solution = useSolution(scenes.s7, copy.solution);
  const flow = usePhoneFlow(scenes, solution.keyframes, solution.textB, copy.lines);
  const cta = useCta(scenes.s10, copy.lines.s10);

  const sentenceChecks = useMemo(
    () => [
      ...hook.sentenceChecks,
      ...s2.checks,
      ...reasons.sentenceChecks,
      ...s6.checks,
      ...solution.sentenceChecks,
      ...flow.sentenceChecks,
      ...cta.checks,
    ],
    [cta, flow, hook, reasons, s2, s6, solution],
  );
  const boxChecks = useMemo(
    () => [...hook.boxChecks, ...s2.boxChecks, ...reasons.boxChecks, ...solution.boxChecks, ...flow.boxChecks],
    [flow, hook, reasons, s2, solution],
  );

  const sfx = useMemo<SfxCue[]>(
    () => [
      ...(hook.stopImpact === undefined ? [] : [{ id: "TODO_SFX_PUNCH" as const, frame: scenes.s1.from + hook.stopImpact }]),
      { id: "TODO_SFX_PUNCH", frame: scenes.s3.from + reasons.naikCue },
      { id: "TODO_SFX_PUNCH", frame: scenes.s3.from + reasons.segituLanding },
      { id: "TODO_SFX_POP", frame: scenes.s7.from + solution.dotPop },
      ...flow.sfx,
      { id: "TODO_SFX_POP", frame: flow.pillSfx },
      { id: "TODO_SFX_POP", frame: flow.notificationSfx },
      { id: "TODO_SFX_TAP", frame: scenes.s10.from + cta.tap },
    ],
    [cta.tap, flow, hook.stopImpact, reasons.naikCue, reasons.segituLanding, scenes, solution.dotPop],
  );

  useEffect(() => {
    // Machine-readable report for scripts/lib/motion-probe.ts (reel:check). Only in debug renders.
    if (debugSafeZone) {
      console.log(`${MOTION_REPORT_MARKER} ${JSON.stringify(buildMotionReport(sentenceChecks, boxChecks))}`);
    }
    if (debugSafeZone || getRemotionEnvironment().isStudio) {
      console.log(
        `[timing] total ${timeline.totalFrames} f = ${(timeline.totalFrames / 30).toFixed(2)} s; ${timeline.order
          .map((id) => `${id} ${scenes[id].from}+${scenes[id].durationInFrames}${scenes[id].missing ? " (no file)" : ""}`)
          .join(", ")}`,
      );
      console.log(`[timing] Segitu landing abs ${scenes.s3.from + reasons.segituLanding}, NAIK cue abs ${scenes.s3.from + reasons.naikCue}`);
      reportTiming(sentenceChecks);
      reportSentenceChecks(sentenceChecks);
      reportBoxChecks(boxChecks);
    }
  }, [boxChecks, debugSafeZone, reasons.naikCue, reasons.segituLanding, scenes, sentenceChecks, timeline]);

  return (
    <>
      <Sequence
        from={scenes.s1.from}
        durationInFrames={scenes.s1.durationInFrames}
        name="S1 Hook"
      >
        <MistBackground />
        <S1Hook hook={hook} />
        {debugSafeZone ? <SafeZoneOverlay checks={hook.sentenceChecks} /> : null}
      </Sequence>
      <Sequence from={scenes.s2.from} durationInFrames={scenes.s2.durationInFrames} name="S2 Black beat">
        <Numpang numpang={s2} />
        {debugSafeZone ? <SafeZoneOverlay checks={s2.checks} /> : null}
      </Sequence>
      <Sequence from={scenes.s3.from} durationInFrames={reasons.durationInFrames} name="S3-S5 Reasons">
        <Reasons reasons={reasons} />
        {debugSafeZone ? <SafeZoneOverlay checks={reasons.sentenceChecks} /> : null}
      </Sequence>
      <Sequence from={scenes.s6.from} durationInFrames={scenes.s6.durationInFrames} name="S6 Black beat">
        <BlackBeat beat={s6} flickerAfterSettled={S6_FLICKER_AFTER} />
        {debugSafeZone ? <SafeZoneOverlay checks={s6.checks} /> : null}
      </Sequence>
      <Sequence from={scenes.s7.from} durationInFrames={scenes.s7.durationInFrames} name="S7 Solution">
        <Solution solution={solution} />
        {debugSafeZone ? <SafeZoneOverlay checks={solution.sentenceChecks} /> : null}
      </Sequence>
      <Sequence from={scenes.s7b.from} durationInFrames={flow.durationInFrames} name="S7b-S9 Phone">
        <PhoneFlow flow={flow} />
        {debugSafeZone ? <SafeZoneOverlay checks={flow.sentenceChecks} /> : null}
      </Sequence>
      <Sequence from={scenes.s10.from} durationInFrames={scenes.s10.durationInFrames} name="S10 CTA">
        <Cta cta={cta} />
        {debugSafeZone ? <SafeZoneOverlay checks={cta.checks} /> : null}
      </Sequence>
      <VoTrack timeline={timeline} />
      <MusicTrack timeline={timeline} />
      <SfxTrack cues={sfx} />
    </>
  );
};
