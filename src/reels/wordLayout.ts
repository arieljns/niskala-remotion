import { measureText } from "@remotion/layout-utils";
import { TONES, type TextStyle, type Tone } from "./tokens";

export type Box = { x: number; y: number; width: number; height: number };
export type WordPart = { text: string; tone?: Tone };
export type LaidOutWord = Box & { text: string; parts: WordPart[]; line: number };
export type SentenceLayout = { words: LaidOutWord[]; box: Box; style: TextStyle };

/** Not in the Archivo file, so it is drawn (see WordBuild) and only needs a width here. */
export const ARROW = "→";
const ARROW_WIDTH_EM = 0.92;

export function measureWidth(text: string, style: TextStyle): number {
  return measureText({
    text,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    additionalStyles: { fontStretch: style.fontStretch },
    validateFontIsLoaded: true,
  }).width;
}

const MARKERS: Record<string, Tone> = { "**": "accent", __: "strong", "~~": "quiet" };

/**
 * Reads the tone markers. Only whitespace ends a word, so in "**tenggelam**."
 * the full stop stays on its word in the sentence's normal tone.
 */
function parseLine(line: string): { text: string; parts: WordPart[] }[] {
  const words: { text: string; parts: WordPart[] }[] = [];
  let parts: WordPart[] = [];
  let tone: Tone | undefined;

  const endWord = () => {
    if (parts.length > 0) {
      words.push({ text: parts.map((part) => part.text).join(""), parts });
      parts = [];
    }
  };

  line.split(/(\*\*|__|~~)/).forEach((chunk) => {
    const marker = MARKERS[chunk];
    if (marker) {
      tone = tone === marker ? undefined : marker;
      return;
    }
    chunk.split(/(\s+)/).forEach((piece) => {
      if (piece.trim().length === 0) {
        if (piece.length > 0) {
          endWord();
        }
        return;
      }
      parts.push({ text: piece, tone });
    });
  });
  endWord();
  return words;
}

export const toneStyle = (style: TextStyle, tone?: Tone): TextStyle => (tone ? { ...style, ...TONES[tone] } : style);

/** Smallest box containing all the given boxes. */
export function unionBox(...boxes: readonly Box[]): Box {
  const x = Math.min(...boxes.map((box) => box.x));
  const y = Math.min(...boxes.map((box) => box.y));
  const right = Math.max(...boxes.map((box) => box.x + box.width));
  const bottom = Math.max(...boxes.map((box) => box.y + box.height));
  return { x, y, width: right - x, height: bottom - y };
}

/** A box scaled about its own centre. */
export function scaleBox(box: Box, scaleX: number, scaleY: number = scaleX): Box {
  const width = box.width * scaleX;
  const height = box.height * scaleY;
  return { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height };
}

/**
 * Lays out explicit lines, left-aligned, either centred on `center` or starting
 * at `topLeft`, in world coordinates. Every word gets its own box, which is what
 * the camera follows and what the safe-zone check tests.
 */
export function layoutSentence({
  lines,
  style,
  center,
  topLeft,
}: {
  lines: readonly string[];
  style: TextStyle;
  center?: { x: number; y: number };
  topLeft?: { x: number; y: number };
}): SentenceLayout {
  // measureText collapses a lone space, so derive its width from a pair.
  const spaceWidth = measureWidth("n n", style) - measureWidth("n", style) * 2;
  const lineHeightPx = style.fontSize * style.lineHeight;

  const measuredLines = lines.map((line) => {
    let cursor = 0;
    const words = parseLine(line).map((word) => {
      const width =
        word.text === ARROW
          ? style.fontSize * ARROW_WIDTH_EM
          : word.parts.reduce(
              (total, part) => total + measureWidth(part.text, toneStyle(style, part.tone)),
              0,
            );
      const measured = { ...word, offset: cursor, width };
      cursor += width + spaceWidth;
      return measured;
    });
    return { words, width: cursor - spaceWidth };
  });

  const width = Math.max(...measuredLines.map((line) => line.width));
  const height = lineHeightPx * lines.length;
  const left = topLeft ? topLeft.x : (center?.x ?? 0) - width / 2;
  const top = topLeft ? topLeft.y : (center?.y ?? 0) - height / 2;

  const words: LaidOutWord[] = [];
  measuredLines.forEach((line, lineIndex) => {
    line.words.forEach((word) => {
      words.push({
        text: word.text,
        parts: word.parts,
        line: lineIndex,
        x: left + word.offset,
        y: top + lineIndex * lineHeightPx,
        width: word.width,
        height: lineHeightPx,
      });
    });
  });

  return { words, box: { x: left, y: top, width, height }, style };
}
