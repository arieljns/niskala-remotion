/**
 * ffmpeg through Remotion's own build (`npx remotion ffmpeg`), so the whole team
 * and CI run the same version, pinned with Remotion. No system ffmpeg needed.
 */
import { spawnSync } from "node:child_process";
import { REPO_ROOT } from "./brief.ts";

export function ffmpeg(args: string[]): { ok: boolean; stderr: string } {
  const run = spawnSync("npx", ["remotion", "ffmpeg", "-hide_banner", "-nostdin", ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: run.status === 0, stderr: run.stderr + run.stdout };
}

export type Loudness = { inputI: number; inputTP: number; inputLRA: number; inputThresh: number; offset: number };

/** The JSON block loudnorm prints at the end of its first pass. */
export function parseLoudnorm(stderr: string): Loudness | null {
  const match = stderr.match(/\{[^{}]*"input_i"[^{}]*\}/);
  if (!match) return null;
  const json = JSON.parse(match[0]) as Record<string, string>;
  return {
    inputI: Number(json.input_i),
    inputTP: Number(json.input_tp),
    inputLRA: Number(json.input_lra),
    inputThresh: Number(json.input_thresh),
    offset: Number(json.target_offset),
  };
}

export type Segment = { start: number; end: number };

/** Stretches of speech between the silences ffmpeg finds, in seconds. */
export function speechSegments(file: string, seconds: number, noiseDb = -35, minSilence = 0.2): Segment[] {
  const run = ffmpeg(["-i", file, "-af", `silencedetect=noise=${noiseDb}dB:d=${minSilence}`, "-f", "null", "-"]);
  const silences: Segment[] = [];
  let open: number | null = null;
  for (const line of run.stderr.split("\n")) {
    const start = /silence_start: (-?[\d.]+)/.exec(line);
    const end = /silence_end: ([\d.]+)/.exec(line);
    if (start) open = Math.max(0, Number(start[1]));
    if (end && open !== null) {
      silences.push({ start: open, end: Number(end[1]) });
      open = null;
    }
  }
  if (open !== null) silences.push({ start: open, end: seconds });
  const speech: Segment[] = [];
  let cursor = 0;
  for (const silence of silences) {
    if (silence.start - cursor > 0.05) speech.push({ start: cursor, end: silence.start });
    cursor = silence.end;
  }
  if (seconds - cursor > 0.05) speech.push({ start: cursor, end: seconds });
  return speech;
}

/** Length of any audio file, read from ffmpeg's own report. */
export function durationSeconds(file: string): number {
  const match = /Duration: (\d+):(\d+):([\d.]+)/.exec(ffmpeg(["-i", file]).stderr);
  if (!match) throw new Error(`Cannot read the length of ${file}`);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}
