import { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { TapRipple } from "../../story/components/TapRipple";
import { MistBackground, NightBackground } from "../Backgrounds";
import { COLORS, FOCAL, SHADOWS } from "../tokens";
import { IKUTI_BOX, PROFILE_CARD, ProfileHeaderCard, SafariUrlBar } from "../ui/ios/Floating";
import { pressAmount, SHEET_SPRING } from "../ui/ios/tokens";
import { LINES } from "./copy";
import { buildHeadlines, Headline } from "./Headlines";
import type { SceneTiming } from "./timeline";

const CUT_LEAD = 3;
const CARD_SCALE = 2.2;
const CARD = { left: FOCAL.x - (PROFILE_CARD.width * CARD_SCALE) / 2, top: 540 };
const URL_BAR_TOP = CARD.top + PROFILE_CARD.height * CARD_SCALE + 36;
const URL_BAR_WIDTH = 340;
const TAP_SECONDS = 3.2;
const FOLLOW_FRAMES = 8;

export function useCta(scene: SceneTiming) {
  return useMemo(() => {
    const headlines = buildHeadlines(
      LINES.s10.map((line, index) => ({
        scene,
        offset: 0,
        lines: line.lines,
        at: line.at,
        center: index === 0 ? FOCAL : undefined,
      })),
    );
    return {
      headlines,
      cut: scene.cues[1] - CUT_LEAD,
      cardIn: scene.cues[1],
      tap: scene.voFrom + Math.round(TAP_SECONDS * 30),
      urlIn: scene.cues[2],
      checks: headlines.map((line) => line.check),
    };
  }, [scene]);
}

/** S10: Night, then a hard cut to Mist with the follow card and the URL. */
export const Cta: React.FC<{ cta: ReturnType<typeof useCta> }> = ({ cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const onNight = frame < cta.cut;
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const card = spring({ frame: Math.max(0, frame - cta.cardIn), fps, config: SHEET_SPRING });
  const bar = spring({ frame: Math.max(0, frame - cta.urlIn), fps, config: SHEET_SPRING });
  const followed = interpolate(frame, [cta.tap + 4, cta.tap + 4 + FOLLOW_FRAMES], [0, 1], clamp);

  return (
    <AbsoluteFill>
      {onNight ? <NightBackground /> : <MistBackground />}
      {!onNight && frame >= cta.cardIn ? (
        <div
          style={{
            position: "absolute",
            left: CARD.left,
            top: CARD.top,
            transformOrigin: "0 0",
            transform: `translateY(${(1 - card) * 420}px) scale(${CARD_SCALE})`,
            opacity: interpolate(card, [0, 0.35], [0, 1], clamp),
          }}
        >
          <ProfileHeaderCard followed={followed} press={pressAmount(frame, cta.tap)} />
          <TapRipple
            x={IKUTI_BOX.x + IKUTI_BOX.width / 2}
            y={IKUTI_BOX.y + IKUTI_BOX.height / 2}
            startFrame={cta.tap}
            color={COLORS.ink}
          />
        </div>
      ) : null}
      {frame >= cta.urlIn ? (
        <div
          style={{
            position: "absolute",
            left: FOCAL.x - (URL_BAR_WIDTH * CARD_SCALE) / 2,
            top: URL_BAR_TOP,
            transformOrigin: "0 0",
            transform: `translateY(${(1 - bar) * 120}px) scale(${CARD_SCALE})`,
            opacity: interpolate(bar, [0, 0.4], [0, 1], clamp),
          }}
        >
          <SafariUrlBar />
        </div>
      ) : null}
      {cta.headlines.map((line, index) => (
        <Headline
          key={line.check.id}
          line={line}
          color={index === 0 ? COLORS.cream : undefined}
          textShadow={index === 0 ? SHADOWS.creamGlow : undefined}
          accentTextShadow={index === 0 ? SHADOWS.accentGlow : undefined}
        />
      ))}
    </AbsoluteFill>
  );
};
