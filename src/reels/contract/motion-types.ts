/** Shapes of the motion report, shared by the browser side (reel01/motionReport.ts) and the node-side checks. No imports. */
export type MotionFinding = {
  code: "HOLD_TOO_SHORT" | "SAFE_ZONE_VIOLATION";
  path: string;
  message: string;
};

export type MotionMetrics = {
  /** The most words entering at the same moment anywhere in the reel (a word enters for MOTION.wordIn frames). */
  maxConcurrentEntrances: number;
  /** Shortest hold, in frames, over all sentences. */
  minHoldFrames: number;
  sentences: number;
};

export type MotionReport = { metrics: MotionMetrics; findings: MotionFinding[] };

export const MOTION_REPORT_MARKER = "[reel-check]";
