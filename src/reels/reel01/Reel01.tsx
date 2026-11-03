import { useEffect, useMemo } from "react";
import { getRemotionEnvironment, Sequence } from "remotion";
import { MistBackground } from "../Backgrounds";
import { reportBoxChecks, reportSentenceChecks, SafeZoneOverlay } from "../debug";
import { useReelFonts } from "../useReelFonts";
import { BlackBeat, useBlackBeat } from "./BlackBeat";
import { Reasons, useReasons } from "./Reasons";
import { S10Outro, useS10Outro } from "./S10Outro";
import { S1Hook, useS1Hook, type HookVariant } from "./S1Hook";
import { Solution, useSolution } from "./Solution";
import { SCENES } from "./timeline";

export type Reel01Props = {
  hookVariant: HookVariant;
  noFeeLine: string;
  debugSafeZone: boolean;
};

export const REEL01_DEFAULT_PROPS: Reel01Props = {
  hookVariant: "A",
  // TODO: Ariel may switch this to "__Nol potongan admin.__" (the marks set the weights)
  noFeeLine: "~~Tanpa~~ __potongan marketplace.__",
  debugSafeZone: false,
};

const S2_LINES = ["~~Seller makin~~ **digilas**", "__marketplace.__"] as const;
/** Local to S2: absolute frames 108-112. */
const S2_FLICKER_FROM = 24;
const S6_LINES = ["~~Kamu yang~~ __kerja,__", "~~platform yang~~ **untung**."] as const;
/** Local to S6: the same place in its hold as S2's. */
const S6_FLICKER_FROM = 30;

/** Text is measured during render, so nothing below may mount before the fonts load. */
export const Reel01: React.FC<Reel01Props> = (props) => {
  const fontsReady = useReelFonts();
  return fontsReady ? <Reel01Scenes {...props} /> : null;
};

const Reel01Scenes: React.FC<Reel01Props> = ({ hookVariant, noFeeLine, debugSafeZone }) => {
  const hook = useS1Hook(hookVariant);
  const s2 = useBlackBeat({
    id: "S2 black beat",
    lines: S2_LINES,
    sceneStart: SCENES.s2.from,
    durationInFrames: SCENES.s2.durationInFrames,
  });
  const reasons = useReasons();
  const s6 = useBlackBeat({
    id: "S6 black beat",
    lines: S6_LINES,
    sceneStart: SCENES.s6.from,
    durationInFrames: SCENES.s6.durationInFrames,
  });
  const solution = useSolution(noFeeLine);
  const outro = useS10Outro();
  const sentenceChecks = useMemo(
    () => [
      hook.check,
      s2.check,
      ...reasons.sentenceChecks,
      s6.check,
      ...solution.sentenceChecks,
      ...outro.checks,
    ],
    [hook.check, outro.checks, reasons.sentenceChecks, s2.check, s6.check, solution.sentenceChecks],
  );
  const boxChecks = useMemo(
    () => [...reasons.boxChecks, ...solution.boxChecks],
    [reasons.boxChecks, solution.boxChecks],
  );

  useEffect(() => {
    if (debugSafeZone || getRemotionEnvironment().isStudio) {
      reportSentenceChecks(sentenceChecks);
      reportBoxChecks(boxChecks);
    }
  }, [boxChecks, debugSafeZone, sentenceChecks]);

  return (
    <>
      <Sequence from={SCENES.s1.from} durationInFrames={SCENES.s1.durationInFrames} name="S1 Hook">
        <MistBackground />
        <S1Hook hook={hook} />
        {debugSafeZone ? <SafeZoneOverlay checks={[hook.check]} /> : null}
      </Sequence>
      <Sequence from={SCENES.s2.from} durationInFrames={SCENES.s2.durationInFrames} name="S2 Black beat">
        <BlackBeat beat={s2} flickerFrom={S2_FLICKER_FROM} />
        {debugSafeZone ? <SafeZoneOverlay checks={[s2.check]} /> : null}
      </Sequence>
      <Sequence from={SCENES.reasons.from} durationInFrames={SCENES.reasons.durationInFrames} name="S3-S5 Reasons">
        <Reasons reasons={reasons} />
        {debugSafeZone ? <SafeZoneOverlay checks={reasons.sentenceChecks} /> : null}
      </Sequence>
      <Sequence from={SCENES.s6.from} durationInFrames={SCENES.s6.durationInFrames} name="S6 Black beat">
        <BlackBeat beat={s6} flickerFrom={S6_FLICKER_FROM} />
        {debugSafeZone ? <SafeZoneOverlay checks={[s6.check]} /> : null}
      </Sequence>
      <Sequence from={SCENES.solution.from} durationInFrames={SCENES.solution.durationInFrames} name="S7-S9 Solution">
        <Solution solution={solution} />
        {debugSafeZone ? <SafeZoneOverlay checks={solution.sentenceChecks} /> : null}
      </Sequence>
      <Sequence from={SCENES.s10.from} durationInFrames={SCENES.s10.durationInFrames} name="S10 Outro">
        <S10Outro outro={outro} />
        {debugSafeZone ? <SafeZoneOverlay checks={outro.checks} /> : null}
      </Sequence>
    </>
  );
};
