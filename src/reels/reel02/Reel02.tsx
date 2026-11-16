import { Audio } from "@remotion/media";
import { useEffect, useMemo } from "react";
import { getRemotionEnvironment, getStaticFiles, Sequence, staticFile } from "remotion";
import { MistBackground } from "../Backgrounds";
import { reportSentenceChecks, SafeZoneOverlay } from "../debug";
import { BlackBeat, useBlackBeat } from "../reel01/BlackBeat";
import { buildHeadlines, Headline } from "../reel01/Headlines";
import type { SceneTiming } from "../reel01/timeline";
import { COLORS, FOCAL, SHADOWS } from "../tokens";
import { useReelFonts } from "../useReelFonts";
import { BEATS, CTA, DROP, GIGIT, HOOK, IKLAN, SEPI, TEASER, TULANG } from "./copy";
import { buildReel02Timeline, INTRO_FRAMES, localFrame, TOTAL_FRAMES, VO_FILE, VO_OFFSET, VO_SECONDS, voFrame } from "./timeline";
import { AdVsSaldo, BiteCard, BlurredCustomers, DashboardDrop, FollowCard, hookArrivals, HookPhone, MeatBone } from "./Visuals";

export type Reel02Props = { debugSafeZone: boolean };
export const REEL02_DEFAULT_PROPS: Reel02Props = { debugSafeZone: false };
export const REEL02_FRAMES = TOTAL_FRAMES;

/** Pinned headlines sit here, above the visual; three lines still clear the safe zone's top. */
const HEADLINE_CENTER = { x: FOCAL.x, y: 380 } as const;

type Line = { lines: readonly string[]; at: readonly number[] };
const headlines = (scene: SceneTiming, lines: readonly Line[], center = HEADLINE_CENTER) =>
  buildHeadlines(lines.map((line) => ({ scene, offset: 0, lines: line.lines, at: line.at, center })));

export const Reel02: React.FC<Reel02Props> = (props) => {
  const fontsReady = useReelFonts();
  return fontsReady ? <Reel02Scenes {...props} /> : null;
};

const Reel02Scenes: React.FC<Reel02Props> = ({ debugSafeZone }) => {
  const scenes = useMemo(() => buildReel02Timeline(), []);

  const hook = useMemo(() => headlines(scenes.hook, [HOOK]), [scenes]);
  const drop = useBlackBeat({ id: "drop", phrases: DROP, scene: scenes.drop });
  const iklan = useMemo(() => headlines(scenes.iklan, IKLAN), [scenes]);
  const sepi = useMemo(() => headlines(scenes.sepi, SEPI), [scenes]);
  const gigit = useMemo(() => headlines(scenes.gigit, GIGIT), [scenes]);
  const tulang = useBlackBeat({ id: "tulang", phrases: TULANG, scene: scenes.tulang });
  const teaser = useMemo(() => headlines(scenes.teaser, TEASER), [scenes]);
  const cta = useMemo(() => headlines(scenes.cta, CTA), [scenes]);

  const checks = useMemo(
    () => [...hook, ...iklan, ...sepi, ...gigit, ...teaser, ...cta].map((line) => line.check).concat(drop.checks, tulang.checks),
    [cta, drop, gigit, hook, iklan, sepi, teaser, tulang],
  );

  useEffect(() => {
    if (debugSafeZone || getRemotionEnvironment().isStudio) {
      console.log(`[timing] Reel02 total ${TOTAL_FRAMES} f = ${(TOTAL_FRAMES / 30).toFixed(2)} s`);
      reportSentenceChecks(checks);
    }
  }, [checks, debugSafeZone]);

  const lf = (scene: SceneTiming, seconds: number) => localFrame(scene, seconds);
  const lines = (built: ReturnType<typeof headlines>, night = false) =>
    built.map((line) => (
      <Headline
        key={line.check.id}
        line={line}
        color={night ? COLORS.cream : undefined}
        textShadow={night ? SHADOWS.creamGlow : undefined}
        accentTextShadow={night ? SHADOWS.accentGlow : undefined}
      />
    ));
  const seq = (scene: SceneTiming, name: string, children: React.ReactNode, sceneChecks = [] as typeof checks) => (
    <Sequence from={scene.from} durationInFrames={scene.durationInFrames} name={name}>
      {children}
      {debugSafeZone ? <SafeZoneOverlay checks={sceneChecks} /> : null}
    </Sequence>
  );

  return (
    <>
      {seq(
        scenes.hook,
        "Hook: rame tiap hari",
        <>
          <MistBackground />
          <HookPhone arrivals={hookArrivals(INTRO_FRAMES, scenes.hook.durationInFrames)} pullOutAt={INTRO_FRAMES} />
          {lines(hook)}
        </>,
        hook.map((line) => line.check),
      )}
      {seq(scenes.drop, "Drop: uangnya nggak ada", <BlackBeat beat={drop} flickerAfterSettled={5} />, drop.checks)}
      {seq(
        scenes.iklan,
        "Iklan vs saldo",
        <>
          <MistBackground frameOffset={scenes.iklan.from} />
          <AdVsSaldo adIn={lf(scenes.iklan, BEATS.adCard)} saldoIn={lf(scenes.iklan, BEATS.saldoCard)} saldoLand={lf(scenes.iklan, BEATS.saldoLand)} />
          {lines(iklan)}
        </>,
        iklan.map((line) => line.check),
      )}
      {seq(
        scenes.sepi,
        "Sepi tiba-tiba",
        <>
          <MistBackground frameOffset={scenes.sepi.from} />
          <DashboardDrop inAt={lf(scenes.sepi, BEATS.dashboardIn)} zoomAt={lf(scenes.sepi, BEATS.zoomDrop)} />
          {lines(sepi)}
        </>,
        sepi.map((line) => line.check),
      )}
      {seq(
        scenes.gigit,
        "Gigitan",
        <>
          <MistBackground frameOffset={scenes.gigit.from} />
          <BiteCard
            inAt={lf(scenes.gigit, BEATS.cardIn)}
            tenseAt={lf(scenes.gigit, BEATS.digigit)}
            biteAt={[lf(scenes.gigit, BEATS.biteAdmin), lf(scenes.gigit, BEATS.biteIklan)]}
          />
          {lines(gigit)}
        </>,
        gigit.map((line) => line.check),
      )}
      {seq(
        scenes.tulang,
        "Daging vs tulang",
        <>
          <BlackBeat beat={tulang} flickerAfterSettled={5} />
          <MeatBone inAt={lf(scenes.tulang, BEATS.meatIn)} takeAt={lf(scenes.tulang, BEATS.meatTaken)} boneAt={lf(scenes.tulang, BEATS.boneLeft)} />
        </>,
        tulang.checks,
      )}
      {seq(
        scenes.teaser,
        "Teaser",
        <>
          <MistBackground frameOffset={scenes.teaser.from} />
          <BlurredCustomers pushAt={lf(scenes.teaser, BEATS.pushIn)} />
          {lines(teaser)}
        </>,
        teaser.map((line) => line.check),
      )}
      {seq(
        scenes.cta,
        "CTA follow",
        <>
          <MistBackground frameOffset={scenes.cta.from} />
          <FollowCard inAt={lf(scenes.cta, BEATS.followCard)} tapAt={lf(scenes.cta, BEATS.tap)} />
          {lines(cta)}
        </>,
        cta.map((line) => line.check),
      )}
      <Sequence from={VO_OFFSET} name="VO" layout="none">
        <Audio src={staticFile(VO_FILE)} />
      </Sequence>
      <MusicTrack grooveFrom={scenes.iklan.from} />
      {sfxCues(scenes).map((cue) => (
        <Sequence key={`${cue.id}-${cue.frame}`} from={cue.frame} name={`SFX ${cue.id}`} layout="none">
          <Audio src={staticFile(`${AUDIO_DIR}/${cue.id}.wav`)} volume={() => cue.gain} />
        </Sequence>
      ))}
    </>
  );
};

/** Every sound here is synthesised by scripts/audio/reel02_audio.py: no licences to track. */
const AUDIO_DIR = "reels/reel02/audio";
const VO_END = voFrame(VO_SECONDS);

type SfxId =
  | "notif"
  | "whoosh"
  | "whoosh_soft"
  | "whoosh_up"
  | "impact"
  | "thud"
  | "fall"
  | "tick"
  | "bite"
  | "pop"
  | "sparkle"
  | "riser"
  | "tap";
type SfxCue = { id: SfxId; frame: number; gain: number };

/** One sound per motion. Frames are absolute; `v` places a cue on a VO second. */
function sfxCues(scenes: ReturnType<typeof buildReel02Timeline>): SfxCue[] {
  const v = voFrame;
  const pings = hookArrivals(INTRO_FRAMES, scenes.hook.durationInFrames).map((frame) => ({
    id: "notif" as const,
    frame,
    gain: frame < INTRO_FRAMES ? 0.6 : 0.12,
  }));
  return [
    ...pings,
    { id: "whoosh", frame: INTRO_FRAMES - 6, gain: 0.5 },
    { id: "impact", frame: scenes.drop.from, gain: 0.85 },
    { id: "whoosh", frame: v(BEATS.adCard) - 4, gain: 0.45 },
    { id: "whoosh_soft", frame: v(BEATS.saldoCard) - 3, gain: 0.5 },
    { id: "thud", frame: v(BEATS.saldoLand), gain: 0.6 },
    { id: "whoosh", frame: v(BEATS.dashboardIn) - 4, gain: 0.45 },
    { id: "fall", frame: v(BEATS.zoomDrop), gain: 0.6 },
    { id: "whoosh", frame: v(BEATS.cardIn) - 4, gain: 0.45 },
    { id: "tick", frame: v(BEATS.digigit), gain: 0.5 },
    { id: "tick", frame: v(BEATS.digigit) + 4, gain: 0.35 },
    { id: "bite", frame: v(BEATS.biteAdmin), gain: 1 },
    { id: "pop", frame: v(BEATS.biteAdmin) + 3, gain: 0.45 },
    { id: "bite", frame: v(BEATS.biteIklan), gain: 1 },
    { id: "pop", frame: v(BEATS.biteIklan) + 3, gain: 0.45 },
    { id: "pop", frame: v(BEATS.meatIn), gain: 0.4 },
    { id: "whoosh_up", frame: v(BEATS.meatTaken), gain: 0.55 },
    { id: "sparkle", frame: v(BEATS.boneLeft), gain: 0.5 },
    { id: "whoosh_soft", frame: scenes.teaser.from, gain: 0.45 },
    { id: "riser", frame: v(33.54) - 45, gain: 0.45 },
    { id: "thud", frame: v(33.54), gain: 0.5 },
    { id: "whoosh", frame: v(BEATS.followCard) - 4, gain: 0.45 },
    { id: "tap", frame: v(BEATS.tap), gain: 0.7 },
    { id: "pop", frame: v(BEATS.tap) + 5, gain: 0.45 },
  ];
}

const db = (value: number) => Math.pow(10, value / 20);
const RAMP = 12;

/**
 * music.wav is a score cut to this edit (scripts/audio/reel02_audio.py): silent
 * under the notification burst, a light groove into a tape stop on the drop,
 * tension through the problems, near silence on the bone, a build that stops
 * dead on "kontrol", and a warm release for the CTA. Here it is only mixed:
 * under the voice, then up for the end card.
 */
const MusicTrack: React.FC<{ grooveFrom: number }> = ({ grooveFrom }) => {
  const names = getStaticFiles().map((file) => file.name);
  const music = ["mp3", "wav", "m4a"].map((ext) => `${AUDIO_DIR}/music.${ext}`).find((path) => names.includes(path));
  if (!music) {
    return null;
  }
  return (
    <Audio
      src={staticFile(music)}
      volume={(frame) => {
        if (frame < grooveFrom) {
          return db(-10);
        }
        if (frame < VO_END) {
          return db(-15);
        }
        return db(-15) + (db(-7) - db(-15)) * Math.min(1, (frame - VO_END) / RAMP);
      }}
    />
  );
};
