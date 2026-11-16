import { Audio } from "@remotion/media";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, Sequence, spring, staticFile, useVideoConfig } from "remotion";
import { useCurrentFrame } from "remotion";
import { displayFont, FONTS } from "../../theme/fonts";
import { SENJA } from "../../theme/senja";
import { SafeZoneOverlay } from "../debug";
import { MistBackground } from "../Backgrounds";
import { Shake } from "../Shake";
import { FollowCard } from "../reel02/Visuals";
import { SafariUrlBar } from "../ui/ios/Floating";
import { SHEET_SPRING } from "../ui/ios/tokens";
import { useReelFonts } from "../useReelFonts";
import { Scene3D, type Images } from "./Scene3D";
import { ALL_SCREENS, B, HITS, sceneAt, SFX, TOTAL_FRAMES, type Bg } from "./timeline";

export type Reel03Props = { debugSafeZone: boolean };
export const REEL03_DEFAULT_PROPS: Reel03Props = { debugSafeZone: false };
export const REEL03_FRAMES = TOTAL_FRAMES;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const BG: Record<Bg, string> = { night: SENJA.night, paper: SENJA.paper50, accent: SENJA.red500, black: "#000" };

/** Every screenshot and the Niskala mark, decoded before the first frame is drawn. */
function useImages(): Images | null {
  const [handle] = useState(() => delayRender("Loading Reel03 screens"));
  const [images, setImages] = useState<Images | null>(null);
  useEffect(() => {
    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Could not load ${src}`));
        img.src = staticFile(src);
      });
    Promise.all([
      ...ALL_SCREENS.map(async (id) => [id, await load(`reels/reel03/screens/${id}.png`)] as const),
      load("reels/reel02/niskala-mark-cream.svg"),
    ])
      .then((loaded) => {
        const logo = loaded[loaded.length - 1] as HTMLImageElement;
        const screens = Object.fromEntries(loaded.slice(0, -1) as (readonly [string, HTMLImageElement])[]);
        setImages({ screens, logo });
        continueRender(handle);
      })
      .catch((err) => {
        throw err;
      });
  }, [handle]);
  return images;
}

const HOOK_BG = [SENJA.night, SENJA.red500, SENJA.paper50, SENJA.night] as const;
const hookStage = (frame: number): number => Math.max(0, HITS.filter((h) => frame >= h).length - 1);

/** Flat background per scene, hard cuts: dark / light / accent. */
const Backgrounds: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < HITS[HITS.length - 1] + 13 && sceneAt(frame).id === "this") {
    // The hook flashes the whole frame on every hit: dark, red, light, dark.
    return <AbsoluteFill style={{ left: -40, top: -40, width: 1160, height: 2000, backgroundColor: HOOK_BG[hookStage(frame)] }} />;
  }
  const id = sceneAt(frame).id;
  if (id === "logo" || id === "end") return <MistBackground />;
  return <AbsoluteFill style={{ left: -40, top: -40, width: 1160, height: 2000, backgroundColor: BG[sceneAt(frame).bg] }} />;
};

const CREAM = SENJA.cream100;
const ACCENT = SENJA.red500;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
// Reels safe zone (tokens.SAFE_ZONE): x 64..940, y 220..1480. All type below stays inside it.
const LEFT = 96;

/** A line of type that lands on its hit: a short rise and fade, then it stays. */
const Line: React.FC<{
  since: number;
  top: number;
  size: number;
  weight: 300 | 500 | 700;
  color: string;
  opacity?: number;
  align?: "left" | "center";
  scale?: number;
  children: React.ReactNode;
}> = ({ since, top, size, weight, color, opacity = 1, align = "left", scale = 1, children }) => {
  if (since < 0) return null;
  const p = ease(interpolate(since, [0, 8], [0, 1], CLAMP));
  return (
    <div
      style={{
        position: "absolute",
        left: align === "left" ? LEFT : 0,
        width: align === "left" ? undefined : 1080,
        textAlign: align,
        top: top + (1 - p) * 36,
        ...displayFont(size, weight),
        lineHeight: 1,
        whiteSpace: "nowrap",
        transform: `scale(${scale})`,
        transformOrigin: align === "left" ? "0% 60%" : "50% 60%",
        color,
        opacity: opacity * interpolate(since, [0, 2], [0.7, 1], CLAMP),
      }}
    >
      {children}
    </div>
  );
};

/** Width of `text` at 100 px in Archivo wide (125%) with Senja tracking, measured once; used to fit each word to the safe zone. */
const measure = (text: string, weight: number): number => {
  const ctx = document.createElement("canvas").getContext("2d")!;
  ctx.font = `${weight} expanded 100px ${FONTS.display}`;
  ctx.letterSpacing = "-4.5px";
  return ctx.measureText(text).width;
};
const SAFE_W = 860; // safe zone is x 64..940
const SAFE_CX = 502;

type HookWord = { text: string; weight: 300 | 500 | 700; ink: string[]; recap: string[] };
// ink / recap colours per stage (0 night, 1 red, 2 paper, 3 night)
const HOOK_WORDS: HookWord[] = [
  { text: "This.", weight: 500, ink: [CREAM], recap: [] },
  { text: "Is how.", weight: 300, ink: [CREAM], recap: [] },
  { text: "Niskala.", weight: 700, ink: [ACCENT], recap: [] },
  { text: "Works.", weight: 500, ink: [CREAM], recap: [] },
];

/**
 * Hook: "This. Is how. Niskala. Works." Each word takes over the whole frame at the widest size the safe zone allows,
 * slams in on its hit with a shockwave ring and a colour flash, and is replaced by the next; no recap. "Niskala." is the climax (heaviest, red on the light flash).
 */
const HookCopy: React.FC = () => {
  const frame = useCurrentFrame();
  const sizes = useMemo(() => HOOK_WORDS.map((w) => (SAFE_W / measure(w.text, w.weight)) * 100), []);
  if (sceneAt(frame).id !== "this") return null;
  const stage = hookStage(frame);
  const since = frame - HITS[stage];
  const word = HOOK_WORDS[stage];
  const slam = 1 + 0.38 * (1 - ease(interpolate(since, [0, 7], [0, 1], CLAMP)));
  const ring = interpolate(since, [0, 16], [0, 1], CLAMP);
  const ringColor = stage === 0 ? ACCENT : stage === 1 ? CREAM : stage === 2 ? ACCENT : CREAM;
  const size = sizes[stage];
  return (
    <AbsoluteFill>
      {stage === 3 ? (
        <AbsoluteFill style={{ background: `radial-gradient(closest-side at 50% 52%, ${ACCENT}66 0%, ${ACCENT}00 70%)`, opacity: interpolate(since, [0, 8], [0, 1], CLAMP) }} />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: SAFE_CX - (ring * 1900) / 2,
          top: 960 - (ring * 1900) / 2,
          width: ring * 1900,
          height: ring * 1900,
          borderRadius: "50%",
          border: `${10 * (1 - ring) + 2}px solid ${ringColor}`,
          opacity: 0.7 * (1 - ring),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: SAFE_CX - SAFE_W / 2 - 60,
          width: SAFE_W + 120,
          top: 960 - size / 2,
          textAlign: "center",
          ...displayFont(size, word.weight),
          lineHeight: 1,
          whiteSpace: "nowrap",
          color: word.ink[0],
          transform: `scale(${slam})`,
          transformOrigin: "50% 55%",
          opacity: interpolate(since, [0, 2], [0.4, 1], CLAMP),
        }}
      >
        {word.text}
      </div>
    </AbsoluteFill>
  );
};

/**
 * CTA, in the Reel01/Reel02 style: Mist background, the Niskala Instagram profile card springs up, gets tapped
 * and flips to Following; Reel01's URL bar slides in under it. One line above credits the project.
 */
const CtaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scene = sceneAt(frame);
  if (scene.id !== "logo" && scene.id !== "end") return null;
  const start = B(43);
  const since = frame - start;
  const bar = spring({ frame: since - B(5.5), fps, config: SHEET_SPRING });
  return (
    <AbsoluteFill>
      <Sequence from={start} layout="none">
        <Line since={since - 4} top={430} size={72} weight={700} color={SENJA.plum900} align="center">
          Mora Jaya <span style={{ fontWeight: 300, color: ACCENT }}>× Niskala</span>
        </Line>
        <FollowCard inAt={2} tapAt={B(4.5)} />
      </Sequence>
      {since >= B(5.5) ? (
        <div
          style={{
            position: "absolute",
            left: 540 - (340 * 1.8) / 2,
            top: 1375,
            transformOrigin: "0 0",
            transform: `translateY(${(1 - bar) * 100}px) scale(1.8)`,
            opacity: interpolate(bar, [0, 0.4], [0, 1], CLAMP),
          }}
        >
          <SafariUrlBar url="niskalaworks.dev" />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const Reel03: React.FC<Reel03Props> = (props) => {
  const fontsReady = useReelFonts();
  return fontsReady ? <Reel03Loaded {...props} /> : null;
};

const Reel03Loaded: React.FC<Reel03Props> = (props) => {
  const images = useImages();
  return images ? <Reel03Scenes {...props} images={images} /> : null;
};

const Reel03Scenes: React.FC<Reel03Props & { images: Images }> = ({ debugSafeZone, images }) => (
  <AbsoluteFill>
    <Shake at={[...HITS]} offsets={[[10, -8], [-8, 6], [4, 3]]}>
      <Backgrounds />
      <Scene3D images={images} />
      <HookCopy />
    </Shake>
    <CtaScene />
    <Sequence from={0} name="Music" layout="none">
      <Audio src={staticFile("reels/reel03/audio/music.wav")} volume={0.9} />
    </Sequence>
    {SFX.map((cue) => (
      <Sequence key={`${cue.id}-${cue.frame}`} from={cue.frame} name={`SFX ${cue.id}`} layout="none">
        <Audio src={staticFile(`reels/reel03/audio/${cue.id}.wav`)} volume={cue.gain} />
      </Sequence>
    ))}
    {debugSafeZone ? <SafeZoneOverlay /> : null}
  </AbsoluteFill>
);
