import type { SentenceCheck } from "../debug";
import { MIN_HOLD, type SceneTiming } from "./timeline";

/** A safe-zone check that also knows the VO it has to keep up with. */
export type TimedCheck = SentenceCheck & {
  scene: SceneTiming;
  /** Local frame of this line's cue. */
  cue: number;
};

export function timedCheck(check: Omit<TimedCheck, "sceneStart" | "minHold">): TimedCheck {
  return { ...check, sceneStart: check.scene.from, minHold: MIN_HOLD };
}

const reported = new Set<string>();

/** Everything the brief asks to have reported: lead on the cue, short holds. */
export function reportTiming(checks: readonly TimedCheck[]): void {
  checks.forEach((check) => {
    if (reported.has(check.id)) {
      return;
    }
    reported.add(check.id);
    const hold = check.holdEnd - check.holdStart;
    const flags = [
      hold < MIN_HOLD ? `SHORT-HOLD ${hold}` : "",
      check.holdStart > check.scene.voEnd ? `HOLD-AFTER-VO by ${check.holdStart - check.scene.voEnd}` : "",
    ].filter(Boolean);
    console.log(
      `[timing] ${check.id}: abs ${check.scene.from + check.starts[0]}, ${check.cue - check.starts[0]} f before cue, hold ${hold} f, hold starts ${check.scene.voEnd - check.holdStart} f before VO ends${flags.length > 0 ? ` | ${flags.join(" | ")}` : ""}`,
    );
  });
}
