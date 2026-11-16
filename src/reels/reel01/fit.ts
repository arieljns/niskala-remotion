import { waitForStoryFonts } from "../../theme/fonts";
import { fitZoom } from "../camera";
import type { ReelSpec } from "../contract/spec.schema";
import { FOCAL, TYPE } from "../tokens";
import { layoutSentence } from "../wordLayout";
import type { FitEntry } from "../contract/fit-types";
import type { ReelTiming } from "../contract/timing-types";
import { buildCopy } from "./copy";
import { hookLayout, STOP_FONT_SIZE } from "./S1Hook";

/**
 * How big each piece of copy would read, measured with the same layout code the
 * render uses (real fonts, real widths), not by counting characters.
 *
 * `readScale` is 1 when the text fits the safe zone at its natural size and
 * drops below 1 when the camera would have to zoom out to fit it, which is
 * what makes text unreadable. The hook is the exception: it is sized to fill
 * the safe width, so its readScale is the resulting font size over the sentence size.
 */

const sentence = (path: string, lines: readonly string[]): FitEntry => {
  const { box } = layoutSentence({ lines, style: TYPE.sentence, center: FOCAL });
  return { path, kind: "sentence", readScale: fitZoom(box), widthPx: Math.round(box.width) };
};

const punch = (
  path: string,
  kind: "stop" | "punch" | "squash",
  lines: readonly string[],
  fontSize: number,
): FitEntry => {
  const { box } = layoutSentence({
    lines,
    style: { ...TYPE[kind === "squash" ? "squash" : "punch"], fontSize },
    center: FOCAL,
  });
  return { path, kind, readScale: fitZoom(box), widthPx: Math.round(box.width) };
};

export async function computeFit(spec: ReelSpec, timing: ReelTiming): Promise<FitEntry[]> {
  await waitForStoryFonts();
  const copy = buildCopy(spec, timing);
  const hook = hookLayout(copy.hook.hook);
  const entries: FitEntry[] = [
    {
      path: "hook.hook",
      kind: "hook",
      readScale: hook.style.fontSize / TYPE.sentence.fontSize,
      widthPx: Math.round(hook.box.width),
    },
    sentence("hook.question", copy.hook.question),
    sentence("numpang.line", copy.numpang.lines),
    sentence("reasons.promo.question", copy.promo.question),
    sentence("reasons.promo.answer", copy.promo.answer),
    sentence("reasons.biaya.label", copy.biaya.label),
    sentence("reasons.biaya.tail", copy.biaya.tail),
    sentence("reasons.omzet.label", copy.omzet.label),
    sentence("reasons.omzet.tail", copy.omzet.tail),
    sentence("solution.first", copy.solution.first),
    sentence("solution.second", copy.solution.second),
    punch("hook.stop", "stop", [copy.hook.stop], STOP_FONT_SIZE),
    punch("reasons.biaya.punch", "punch", [copy.biaya.punch], TYPE.punch.fontSize),
    punch("reasons.omzet.squash", "squash", copy.omzet.squash, TYPE.squash.fontSize),
  ];
  copy.blackBeats.s6.forEach((item, index) => entries.push(sentence(`blackBeat.phrase.${index}`, item.lines)));
  (["s7b", "s8a", "s8b", "s8c", "s8d", "s9", "s10"] as const).forEach((key) =>
    copy.lines[key].forEach((item, index) => entries.push(sentence(`phone.${key}.${index}`, item.lines))),
  );
  return entries;
}
