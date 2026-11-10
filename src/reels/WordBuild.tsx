import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, EASINGS, MOTION } from "./tokens";
import { ARROW, toneStyle, type SentenceLayout } from "./wordLayout";

/** A fixed gap between words, or each word's own start frame. */
export type WordPace = number | readonly number[];

/** Frame each word starts entering, and the frame the last one has settled. */
export function wordTiming(layout: SentenceLayout, startFrame: number, pace: WordPace) {
  const starts = layout.words.map((_, index) => (typeof pace === "number" ? startFrame + index * pace : pace[index]));
  return { starts, settled: starts[starts.length - 1] + MOTION.wordIn };
}

const CLAMP_BRAND = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: EASINGS.brand,
} as const;

const ArrowGlyph: React.FC<{ width: number }> = ({ width }) => (
  <svg
    viewBox="0 0 92 60"
    width={width}
    style={{ display: "inline-block", verticalAlign: "-0.02em", overflow: "visible" }}
    fill="none"
    stroke="currentColor"
    strokeWidth={8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M 6 30 H 84 M 60 8 L 84 30 L 60 52" />
  </svg>
);

export type WordBuildProps = {
  layout: SentenceLayout;
  startFrame: number;
  gap?: WordPace;
  color?: string;
  accentColor?: string;
  textShadow?: string;
  accentTextShadow?: string;
};

/** Builds a sentence word by word at the positions layoutSentence computed. */
export const WordBuild: React.FC<WordBuildProps> = ({
  layout,
  startFrame,
  gap = MOTION.wordGap,
  color = COLORS.ink,
  accentColor = COLORS.accent,
  textShadow,
  accentTextShadow,
}) => {
  const frame = useCurrentFrame();
  const { starts } = wordTiming(layout, startFrame, gap);
  const { style } = layout;

  return (
    <>
      {layout.words.map((word, index) => {
        const start = starts[index];
        if (frame < start) {
          return null;
        }
        const end = start + MOTION.wordIn;
        const blur = interpolate(frame, [start, end], [16, 0], CLAMP_BRAND);

        return (
          <div
            key={`${index}-${word.text}`}
            style={{
              position: "absolute",
              left: word.x,
              top: word.y,
              whiteSpace: "pre",
              fontFamily: style.fontFamily,
              fontStretch: style.fontStretch,
              fontWeight: style.fontWeight,
              fontSize: style.fontSize,
              letterSpacing: style.letterSpacing,
              lineHeight: `${word.height}px`,
              color,
              textShadow,
              opacity: interpolate(frame, [start, end], [0, 1], CLAMP_BRAND),
              translate: `${interpolate(frame, [start, end], [14, 0], CLAMP_BRAND)}px 0px`,
              filter: blur > 0 ? `blur(${blur}px)` : undefined,
            }}
          >
            {word.parts.map((part, partIndex) => {
              if (part.text === ARROW) {
                return <ArrowGlyph key={partIndex} width={word.width} />;
              }
              const type = toneStyle(style, part.tone);
              const isAccent = part.tone === "accent";
              return (
                <span
                  key={partIndex}
                  style={{
                    fontStretch: type.fontStretch,
                    fontWeight: type.fontWeight,
                    letterSpacing: type.letterSpacing,
                    color: isAccent ? accentColor : color,
                    textShadow: isAccent ? (accentTextShadow ?? textShadow) : textShadow,
                  }}
                >
                  {part.text}
                </span>
              );
            })}
          </div>
        );
      })}
    </>
  );
};
