import { useCurrentFrame } from "remotion";
import { displayFont, FONTS } from "../../theme/fonts";
import { easedInterpolate } from "../../theme/motion";
import { SURFACE_STYLE } from "../../theme/senja";
import { useLayout, type Layout } from "../../useLayout";
import { useSurface } from "../senja/Surface";

/** Per-word rise + fade, staggered by 2 frames. */
export const CAPTION_ENTER_FRAMES = 14;
const STAGGER = 2;
const EXIT_FRAMES = 8;

export type CaptionProps = {
  /** Caption text. Mark at most one accent phrase with **double asterisks**. */
  text: string;
  /** Optional Lexend 300 sub-line. */
  sub?: string;
  /** Scene-relative frame the first word starts entering. */
  startFrame?: number;
  /** Scene-relative frame the caption has fully faded out (exit is the 8 frames before it). */
  endFrame?: number;
  /** Render in normal flow, centred, instead of in the fixed caption box (the end card's centred stack). */
  centered?: boolean;
};

/** `joinPrev`: no space before this word (punctuation right after an accent phrase, e.g. "**turun 58%**."). */
type Token = { text: string; accent: boolean; accentOffset: number; accentLength: number; joinPrev: boolean };

/** Splits "a **b c** d" into word tokens, remembering where each accent word sits in its phrase. */
export function tokenizeCaption(text: string): { tokens: Token[]; plain: string } {
  if ((text.match(/\*\*/g)?.length ?? 0) > 2) throw new Error(`Caption has more than one accent phrase: ${text}`);
  const match = text.match(/\*\*(.+?)\*\*/);
  const accentPhrase = match?.[1] ?? "";
  const plain = text.replace(/\*\*/g, "");

  const tokens: Token[] = [];
  const parts = match ? [text.slice(0, match.index), accentPhrase, text.slice((match.index ?? 0) + match[0].length)] : [text];
  parts.forEach((part, i) => {
    const accent = Boolean(match) && i === 1;
    // Glued only when neither side of the boundary has a space ("**turun 58%**." → no space before ".").
    const prev = i > 0 ? parts[i - 1] : "";
    const glued = tokens.length > 0 && part.length > 0 && !/^\s/.test(part) && !/\s$/.test(prev);
    let offset = 0;
    part
      .split(" ")
      .filter(Boolean)
      .forEach((word, w) => {
        tokens.push({ text: word, accent, accentOffset: offset, accentLength: accentPhrase.length, joinPrev: glued && w === 0 });
        offset += word.length + 1;
      });
  });
  return { tokens, plain };
}

/** Caption box and size per orientation (Senja: left 40% in 16:9, top third in 9:16). */
function getCaptionBox(layout: Layout, length: number, sunset: boolean) {
  if (layout.isPortrait) {
    const fontSize = length <= 48 ? 80 : length <= 72 ? 72 : 64;
    return { left: layout.width * 0.07, width: layout.width * 0.86, top: layout.height * 0.07, centerY: false, fontSize };
  }
  const fontSize = length <= 48 ? 68 : length <= 72 ? 60 : 56;
  // On sunset all text stays in the top/left 60%, so the caption hangs from the top.
  return { left: layout.width * 0.06, width: layout.width * 0.36, top: sunset ? layout.height * 0.12 : 0, centerY: !sunset, fontSize };
}

/**
 * The one caption per scene, in Senja: Archivo 125/500, sentence case, at
 * most one accent phrase (gradient on night/paper, solid plum-800 on sunset).
 * Reads its surface from the enclosing <Surface>.
 */
export const Caption: React.FC<CaptionProps> = ({ text, sub, startFrame = 0, endFrame, centered = false }) => {
  const frame = useCurrentFrame();
  const layout = useLayout();
  const surface = useSurface();
  const style = SURFACE_STYLE[surface];
  const { tokens, plain } = tokenizeCaption(text);
  const box = getCaptionBox(layout, plain.length, surface === "sunset");
  const exit = endFrame === undefined ? 1 : easedInterpolate(frame, [endFrame - EXIT_FRAMES, endFrame], [1, 0]);

  const enter = (i: number) =>
    easedInterpolate(frame, [startFrame + i * STAGGER, startFrame + i * STAGGER + CAPTION_ENTER_FRAMES], [0, 1]);

  const accentStyle = (t: Token): React.CSSProperties => {
    if (!t.accent) return {};
    if ("solid" in style.accent) return { color: style.accent.solid };
    // Each word paints its own slice of one phrase-wide gradient, so the
    // gradient reads continuous across words and line wraps.
    const total = Math.max(t.accentLength, t.text.length + 1);
    const slice = t.text.length;
    const position = (t.accentOffset / (total - slice)) * 100;
    return {
      backgroundImage: style.accent.gradient,
      backgroundSize: `${(total / slice) * 100}% 100%`,
      backgroundPosition: `${position}% 0`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    };
  };

  return (
    <div
      style={{
        ...(centered
          ? { position: "relative", textAlign: "center" }
          : {
              position: "absolute",
              left: box.left,
              width: box.width,
              top: box.top,
              bottom: box.centerY ? 0 : undefined,
              justifyContent: box.centerY ? "center" : "flex-start",
            }),
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        opacity: exit,
        color: style.text,
      }}
    >
      <div style={{ ...displayFont(box.fontSize, 500), lineHeight: 1.06 }}>
        {tokens.map((t, i) => {
          const p = enter(i);
          return (
            <span key={i}>
              <span
                style={{
                  display: "inline-block",
                  opacity: p,
                  transform: `translateY(${(1 - p) * 16}px)`,
                  // Room for descenders inside the clipped gradient box.
                  paddingBottom: "0.08em",
                  ...accentStyle(t),
                }}
              >
                {t.text}
              </span>
              {tokens[i + 1] && !tokens[i + 1].joinPrev ? " " : null}
            </span>
          );
        })}
      </div>
      {sub ? (
        <div
          style={{
            marginTop: box.fontSize * 0.4,
            fontFamily: FONTS.body,
            fontWeight: 300,
            fontSize: layout.isPortrait ? 26 : 24,
            lineHeight: 1.45,
            opacity: 0.85 * enter(tokens.length),
            transform: `translateY(${(1 - enter(tokens.length)) * 16}px)`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
