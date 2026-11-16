import type { BoxCheck, SentenceCheck } from "../debug";
import { checkBox, checkSentence } from "../debug";
import type { MotionFinding, MotionReport } from "../contract/motion-types";
import { MOTION } from "../tokens";

/** What checkSentence and checkBox say, as findings a machine can read. */
const classify = (problem: string): MotionFinding => {
  const id = problem.split(":")[0];
  const code = /hold is -?\d+ f/.test(problem) ? "HOLD_TOO_SHORT" : "SAFE_ZONE_VIOLATION";
  return { code, path: id, message: problem };
};

/**
 * Motion and safe-zone findings for the whole reel, using the same checks the
 * dev overlay uses, plus how many words enter at once (the motion budget).
 */
export function buildMotionReport(
  sentenceChecks: readonly SentenceCheck[],
  boxChecks: readonly BoxCheck[],
): MotionReport {
  const findings: MotionFinding[] = [
    ...sentenceChecks.flatMap((check) => checkSentence(check).map(classify)),
    ...boxChecks.flatMap((check) => checkBox(check).map(classify)),
  ];

  // Every word's entrance window, in absolute frames.
  const windows = sentenceChecks.flatMap((check) =>
    check.starts.map((start) => [start + check.sceneStart, start + check.sceneStart + MOTION.wordIn] as const),
  );
  const edges = [...new Set(windows.map(([from]) => from))];
  const maxConcurrentEntrances = Math.max(
    0,
    ...edges.map((frame) => windows.filter(([from, to]) => from <= frame && frame < to).length),
  );

  const holds = sentenceChecks.map((check) => check.holdEnd - check.holdStart);
  return {
    metrics: {
      maxConcurrentEntrances,
      minHoldFrames: holds.length ? Math.min(...holds) : 0,
      sentences: sentenceChecks.length,
    },
    findings,
  };
}
