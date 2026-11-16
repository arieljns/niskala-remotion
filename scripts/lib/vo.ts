/**
 * Voice-over preparation. Every VO, whether a recording or any TTS, goes through
 * one fixed step: trim silence at both ends, loudness -16 LUFS, 48 kHz mono WAV.
 * public/reels/<id>/vo-raw/<scene>.<ext>  ->  public/reels/<id>/vo/<scene>.wav
 * plus vo/prep.json with the hash of each prepared file. A file in vo/ that is not
 * in prep.json with the same hash did not go through the step (VO_NOT_NORMALIZED).
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import type { SpecError } from "./copy-lint.ts";
import { durationSeconds, ffmpeg, parseLoudnorm, speechSegments } from "./ffmpeg.ts";
import { wavInfo } from "./wav.ts";

export const TARGET_LUFS = -16;
export const TARGET_TP = -1.5;
export const TARGET_LRA = 11;

export type PrepRecord = {
  version: 1;
  targetLufs: number;
  files: Record<string, { sha256: string; sampleRate: number; channels: number; seconds: number; inputLufs: number }>;
};

/** Keeps this much silence before the first word and after the last, so the first cue still has room. */
const LEAD = 0.05;
const TAIL = 0.1;

/**
 * Remotion's ffmpeg build has no silenceremove filter, so the edges are found with
 * silencedetect and cut with atrim.
 */
function trimFilter(input: string): string | null {
  const seconds = durationSeconds(input);
  const speech = speechSegments(input, seconds, -50, 0.1);
  if (speech.length === 0) return null;
  const start = Math.max(0, speech[0].start - LEAD);
  const end = Math.min(seconds, speech.at(-1)!.end + TAIL);
  return `atrim=start=${start.toFixed(3)}:end=${end.toFixed(3)},asetpts=PTS-STARTPTS`;
}

export function prepareOne(input: string, output: string): { ok: boolean; message: string; inputLufs: number } {
  const trim = trimFilter(input);
  if (!trim) return { ok: false, message: "Tidak ada suara di rekaman ini (hening seluruhnya).", inputLufs: NaN };
  const loudnorm = `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TP}:LRA=${TARGET_LRA}`;
  const first = ffmpeg(["-i", input, "-af", `${trim},${loudnorm}:print_format=json`, "-f", "null", "-"]);
  const measured = parseLoudnorm(first.stderr);
  if (!first.ok || !measured)
    return { ok: false, message: `Gagal mengukur loudness. ${first.stderr.slice(-200)}`, inputLufs: NaN };
  const second = `${loudnorm}:measured_I=${measured.inputI}:measured_TP=${measured.inputTP}:measured_LRA=${measured.inputLRA}:measured_thresh=${measured.inputThresh}:offset=${measured.offset}:linear=true`;
  const run = ffmpeg([
    "-y",
    "-i",
    input,
    "-af",
    `${trim},${second},aresample=48000`,
    "-ac",
    "1",
    "-ar",
    "48000",
    "-c:a",
    "pcm_s16le",
    output,
  ]);
  return { ok: run.ok, message: run.ok ? "" : run.stderr.slice(-300), inputLufs: measured.inputI };
}

const sha256 = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

export function describeOutput(path: string, inputLufs: number): PrepRecord["files"][string] {
  const info = wavInfo(path)!;
  return {
    sha256: sha256(path),
    sampleRate: info.sampleRate,
    channels: info.channels,
    seconds: Math.round(info.seconds * 100) / 100,
    inputLufs,
  };
}

/** Every WAV in a VO folder must have been prepared by reel:vo-prep. */
export function lintVo(voDir: string): SpecError[] {
  const errors: SpecError[] = [];
  const recordPath = `${voDir}/prep.json`;
  const record: PrepRecord | null = existsSync(recordPath)
    ? (JSON.parse(readFileSync(recordPath, "utf8")) as PrepRecord)
    : null;
  const files = existsSync(voDir) ? readdirSync(voDir).filter((name) => /\.wav$/i.test(name)) : [];
  for (const name of files) {
    const known = record?.files[name];
    const info = wavInfo(`${voDir}/${name}`);
    if (!known || known.sha256 !== sha256(`${voDir}/${name}`)) {
      errors.push({
        code: "VO_NOT_NORMALIZED",
        path: name,
        message: !record
          ? "Tidak ada prep.json: file ini belum lewat reel:vo-prep."
          : !known
            ? "File ini tidak tercatat di prep.json."
            : "Isi file berbeda dari yang dicatat reel:vo-prep (diganti setelahnya).",
        hint: "Taruh rekaman mentah di vo-raw/ lalu jalankan reel:vo-prep. Semua VO diproses dengan langkah yang sama.",
      });
    } else if (!info || info.sampleRate !== 48000 || info.channels !== 1) {
      errors.push({
        code: "VO_NOT_NORMALIZED",
        path: name,
        message: "Bukan WAV 48 kHz mono.",
        hint: "Jalankan ulang reel:vo-prep.",
      });
    }
  }
  return errors;
}
