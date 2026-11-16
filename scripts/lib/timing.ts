/**
 * Timing from a recording: suggest cue and word times (reel:cues), turn a
 * confirmed suggestion into the sidecar, and check a sidecar.
 *
 * The suggestion is a heuristic, not speech recognition: words are placed on the
 * speech-only clock (the stretches ffmpeg hears as sound) in proportion to their
 * length. A human listens and confirms. It is measured against Reel01's
 * hand-measured times in test:cues so we know how far off it is.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import {
  SCENE_CUE_COUNT,
  SCENE_IDS,
  SCENE_SPEECH,
  scenePhrases,
  type ReelTiming,
  type TimedSceneId,
} from "../../src/reels/contract/timing-types.ts";
import type { ReelSpec } from "../../src/reels/contract/spec.schema.ts";
import type { Segment } from "./ffmpeg.ts";
import { REPO_ROOT } from "./brief.ts";
import type { SpecError } from "./copy-lint.ts";
import { speechText } from "./spec-walk.ts";
import { wavInfo } from "./wav.ts";

export type SceneAnalysis = { file: string; seconds: number; segments: Segment[] };
export type CuesFile = {
  version: 1;
  id: string;
  createdBy: "reel:cues";
  /** Always true: a person must listen to the recording and confirm. */
  needsHumanReview: true;
  voDir: string;
  scenes: Record<
    TimedSceneId,
    { file: string; seconds: number; segments: Segment[]; cues: number[]; confidence: "high" | "low" }
  >;
  words: Record<string, number[]>;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const wordsOf = (text: string) => text.split(/\s+/).filter(Boolean);
const weight = (word: string) => Math.max(1, word.replace(/[^\p{L}\p{N}]/gu, "").length);

/** Maps an offset on the speech-only clock to a time in the file. */
function clockToTime(segments: readonly Segment[], offset: number): number {
  let left = offset;
  for (const segment of segments) {
    const length = segment.end - segment.start;
    if (left <= length) return segment.start + left;
    left -= length;
  }
  return segments.at(-1)?.end ?? 0;
}

export function proposeTiming(
  id: string,
  voDir: string,
  analyses: Record<TimedSceneId, SceneAnalysis>,
  spec: ReelSpec,
): CuesFile {
  const scenes = {} as CuesFile["scenes"];
  const words: Record<string, number[]> = {};

  for (const scene of SCENE_IDS) {
    const { file, seconds, segments } = analyses[scene];
    const speech = segments.length > 0 ? segments : [{ start: 0.05, end: seconds }];
    const total = speech.reduce((sum, s) => sum + (s.end - s.start), 0);

    const items = SCENE_SPEECH[scene].map((path) => ({
      path,
      words: wordsOf(speechText(spec, path)),
    }));
    const chars = items.reduce((sum, item) => sum + item.words.reduce((a, w) => a + weight(w), 0), 0);

    let cursor = 0;
    for (const item of items) {
      const starts = item.words.map((word) => {
        const at = clockToTime(speech, (cursor / chars) * total);
        cursor += weight(word);
        return round2(at);
      });
      if (!item.path.startsWith("~")) words[item.path] = starts;
    }

    const need = SCENE_CUE_COUNT[scene];
    const cues = Array.from({ length: need }, (_, i) =>
      round2(segments.length >= need ? segments[i].start : clockToTime(speech, (i / need) * total)),
    );
    scenes[scene] = {
      file,
      seconds: round2(seconds),
      segments: speech.map((s) => ({ start: round2(s.start), end: round2(s.end) })),
      cues,
      confidence: segments.length === need ? "high" : "low",
    };
  }
  return { version: 1, id, createdBy: "reel:cues", needsHumanReview: true, voDir, scenes, words };
}

export const hashText = (text: string) => createHash("sha256").update(text).digest("hex");

/** A confirmed cues file becomes the sidecar the kit reads. Only the hash chain ties it back to the recording. */
export function buildTimingFromCues(cuesText: string, confirmedBy: string, now = new Date()): ReelTiming {
  const cues = JSON.parse(cuesText) as CuesFile;
  const scenes = {} as ReelTiming["scenes"];
  for (const scene of SCENE_IDS) {
    const s = cues.scenes[scene];
    scenes[scene] = { file: s.file, expectedSeconds: s.seconds, cues: s.cues };
  }
  return {
    version: 1,
    source: "cues",
    voDir: cues.voDir,
    scenes,
    words: cues.words,
    cuesHash: hashText(cuesText),
    confirmedBy,
    confirmedAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------- checks

const increasing = (values: readonly number[]) => values.every((v, i) => i === 0 || v > values[i - 1]);

export type TimingContext = {
  root?: string;
  /** Golden specs are references: they may carry the hand-measured legacy timing. */
  golden: boolean;
  /** Text of out/<id>/cues.json, if it exists. */
  cuesText: string | null;
};

export function lintTiming(timing: ReelTiming, ctx: TimingContext): SpecError[] {
  const errors: SpecError[] = [];
  const root = ctx.root ?? REPO_ROOT;
  const err = (code: string, path: string, message: string, hint: string) => errors.push({ code, path, message, hint });

  // The keys must be exactly the ones the preset has.
  for (const scene of SCENE_IDS) {
    const vo = timing.scenes?.[scene];
    if (!vo) {
      err(
        "CUE_UNKNOWN",
        `scenes.${scene}`,
        `Scene ${scene} tidak ada di berkas timing.`,
        "Jalankan reel:cues dan konfirmasi hasilnya.",
      );
      continue;
    }
    if (vo.cues.length !== SCENE_CUE_COUNT[scene]) {
      err(
        "CUE_UNKNOWN",
        `scenes.${scene}.cues`,
        `Scene ${scene} butuh ${SCENE_CUE_COUNT[scene]} cue, berkas punya ${vo.cues.length}.`,
        "Cue hanya yang didefinisikan preset. Jalankan ulang reel:cues.",
      );
    }
    if (!increasing(vo.cues)) {
      err(
        "CUE_ORDER",
        `scenes.${scene}.cues`,
        `Cue scene ${scene} tidak naik: ${vo.cues.join(", ")}.`,
        "Cue harus urut waktu. Dengarkan lagi dan jalankan ulang reel:cues.",
      );
    }
    const file = `${root}/public/${timing.voDir}/${vo.file}`;
    const wav = existsSync(file) ? wavInfo(file) : null;
    if (!wav) {
      err(
        "VO_MISSING",
        `scenes.${scene}.file`,
        `File VO ${timing.voDir}/${vo.file} tidak ada atau bukan WAV.`,
        "Taruh rekaman scene ini di folder VO lalu jalankan reel:vo-prep.",
      );
    } else {
      const last = vo.cues.at(-1) ?? 0;
      if (last > wav.seconds + 0.01) {
        err(
          "CUE_OUT_OF_RANGE",
          `scenes.${scene}.cues`,
          `Cue ${last}s melewati panjang rekaman (${wav.seconds.toFixed(2)}s).`,
          "Cue di luar rekaman tidak akan pernah terdengar. Jalankan ulang reel:cues pada file yang benar.",
        );
      }
      if (Math.abs(wav.seconds - vo.expectedSeconds) > 0.15) {
        err(
          "CUE_OUT_OF_RANGE",
          `scenes.${scene}.expectedSeconds`,
          `Berkas timing mencatat ${vo.expectedSeconds}s, rekaman sebenarnya ${wav.seconds.toFixed(2)}s.`,
          "Rekaman diganti setelah timing dibuat. Jalankan ulang reel:cues.",
        );
      }
    }
    for (const path of scenePhrases(scene)) {
      const times = timing.words?.[path];
      if (!times)
        err("CUE_UNKNOWN", `words.${path}`, `Waktu kata untuk "${path}" tidak ada.`, "Jalankan ulang reel:cues.");
      else if (!increasing(times))
        err("CUE_ORDER", `words.${path}`, `Waktu kata "${path}" tidak naik.`, "Waktu kata harus urut.");
    }
  }
  const known = new Set(SCENE_IDS.flatMap((scene) => scenePhrases(scene)));
  for (const path of Object.keys(timing.words ?? {})) {
    if (!known.has(path))
      err("CUE_UNKNOWN", `words.${path}`, `Kunci "${path}" bukan frasa yang diketahui preset.`, "Hapus kunci itu.");
  }

  // Where the numbers came from.
  if (timing.source === "legacy-reel01") {
    if (!ctx.golden) {
      err(
        "TIMING_NOT_CONFIRMED",
        "source",
        "Timing legacy-reel01 hanya untuk spec golden.",
        "Rekam VO sendiri lalu jalankan reel:cues dan konfirmasi.",
      );
    }
  } else {
    if (!ctx.cuesText) {
      err(
        "TIMING_NOT_CONFIRMED",
        "cuesHash",
        "Tidak ada out/<id>/cues.json untuk dibandingkan.",
        "Jalankan reel:cues.",
      );
    } else if (timing.cuesHash !== hashText(ctx.cuesText)) {
      err(
        "TIMING_NOT_CONFIRMED",
        "cuesHash",
        "cues.json berubah sejak timing ini dikonfirmasi.",
        "Dengarkan lagi dan konfirmasi ulang: reel:cues --confirm.",
      );
    } else {
      const expected = buildTimingFromCues(ctx.cuesText, timing.confirmedBy ?? "", new Date(timing.confirmedAt ?? 0));
      if (
        JSON.stringify(expected.scenes) !== JSON.stringify(timing.scenes) ||
        JSON.stringify(expected.words) !== JSON.stringify(timing.words)
      ) {
        err(
          "TIMING_NOT_CONFIRMED",
          "scenes",
          "Angka di berkas timing berbeda dari cues.json yang dikonfirmasi (diubah tangan?).",
          "Timing tidak boleh diketik atau diedit. Ubah lewat reel:cues.",
        );
      }
    }
    if (!timing.confirmedBy)
      err(
        "TIMING_NOT_CONFIRMED",
        "confirmedBy",
        "Belum ada nama manusia yang mengonfirmasi.",
        "Jalankan reel:cues --confirm.",
      );
  }
  return errors;
}
