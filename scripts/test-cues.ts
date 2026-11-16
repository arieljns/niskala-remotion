/**
 * npm run test:cues
 *
 * Measures how good the timing SUGGESTION is, using Reel01: run reel:cues' logic
 * on Reel01's real voice-over and compare with the times a person measured by
 * hand. Prints the errors; it does not pass or fail on a threshold, because the
 * suggestion is only a starting point for a human who listens and confirms.
 */
import { REPO_ROOT } from "./lib/brief.ts";
import { speechSegments } from "./lib/ffmpeg.ts";
import { proposeTiming, type SceneAnalysis } from "./lib/timing.ts";
import { wavInfo } from "./lib/wav.ts";
import { SCENE_IDS, scenePhrases, type ReelTiming, type TimedSceneId } from "../src/reels/contract/timing-types.ts";
import { spec } from "../src/reels/specs/_golden/reel01.ts";
import legacy from "../src/reels/specs/_golden/reel01.timing.json" with { type: "json" };

const timing = legacy as ReelTiming;
const analyses = {} as Record<TimedSceneId, SceneAnalysis>;
for (const scene of SCENE_IDS) {
  const file = `${REPO_ROOT}/public/${timing.voDir}/${timing.scenes[scene].file}`;
  const seconds = wavInfo(file)!.seconds;
  analyses[scene] = { file: timing.scenes[scene].file, seconds, segments: speechSegments(file, seconds) };
}
const proposal = proposeTiming("reel01", timing.voDir, analyses, spec);

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
const within = (values: number[], limit: number) => values.filter((v) => v <= limit).length;
const cueErrors: number[] = [];
const wordErrors: number[] = [];

console.log("scene  segmen/cue  keyakinan  galat cue (s)  galat kata (s)");
for (const scene of SCENE_IDS) {
  const p = proposal.scenes[scene];
  const ce = p.cues.map((cue, i) => Math.abs(cue - timing.scenes[scene].cues[i]));
  const we = scenePhrases(scene).flatMap((path) =>
    proposal.words[path].map((word, i) => Math.abs(word - timing.words[path][i])),
  );
  cueErrors.push(...ce);
  wordErrors.push(...we);
  console.log(
    `${scene.padEnd(5)}  ${String(analyses[scene].segments.length).padStart(2)}/${p.cues.length}        ${p.confidence.padEnd(9)}  ${mean(ce).toFixed(2).padStart(8)}       ${mean(we).toFixed(2).padStart(8)}`,
  );
}

console.log(
  `\nCue:  ${cueErrors.length} nilai, rata-rata galat ${mean(cueErrors).toFixed(2)} s, ${within(cueErrors, 0.1)} dalam 0,1 s`,
);
console.log(
  `Kata: ${wordErrors.length} nilai, rata-rata galat ${mean(wordErrors).toFixed(2)} s, ${within(wordErrors, 0.15)} dalam 0,15 s, ${within(wordErrors, 0.3)} dalam 0,3 s`,
);
