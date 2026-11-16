/**
 * The official render and the check that it matches what a human approved.
 * Both run only from reel:verify and reel:render, behind the APPROVED gate.
 */
import { renderMedia, selectComposition } from "@remotion/renderer";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import type { SpecError } from "./copy-lint.ts";
import { lintDuration } from "./fit-probe.ts";
import type { Session } from "./check-reel.ts";
import { compareFrames } from "./image-compare.ts";
import { approvalPath, type Ctx } from "./pipeline.ts";

/** Fixed encoding, the same for every reel. */
export const ENCODING = { codec: "h264", crf: 18, x264Preset: "veryfast", imageFormat: "jpeg" } as const;

type StillsRecord = { frames: { frame: number; scene: string; file: string }[] };

export type FrameVerdict = {
  frame: number;
  scene: string;
  same: "identical" | "noise" | "different";
  psnr: number | null;
};

/** Renders the frames the human approved again and compares each to its approved still. */
export async function verifyAgainstApproved(
  ctx: Ctx,
  session: Session,
  spec: unknown,
  timing: unknown,
): Promise<{ errors: SpecError[]; frames: FrameVerdict[] }> {
  const errors: SpecError[] = [];
  const recordPath = `${ctx.outDir}/stills.json`;
  if (!existsSync(recordPath)) {
    return {
      errors: [
        {
          code: "VERIFY_DIFF",
          path: "stills.json",
          message: "Tidak ada stills.json untuk dibandingkan.",
          hint: "Jalankan reel:stills dan approve dulu.",
        },
      ],
      frames: [],
    };
  }
  const approved = JSON.parse(readFileSync(recordPath, "utf8")) as StillsRecord;
  for (const f of approved.frames) {
    const path = `${ctx.outDir}/stills/${f.file}`;
    // Their content is sealed by APPROVED (evidence group); here only presence matters.
    if (!existsSync(path)) {
      errors.push({
        code: "VERIFY_DIFF",
        path: f.file,
        message: "Still yang di-approve hilang.",
        hint: "Jalankan reel:stills lagi dan approve ulang.",
      });
    }
  }
  if (errors.length) return { errors, frames: [] };

  const dir = `${ctx.outDir}/verify`;
  const rendered = await session.stills(spec, timing, dir);
  const frames: FrameVerdict[] = [];
  for (const r of rendered) {
    const base = approved.frames.find((f) => f.frame === r.frame);
    if (!base) continue;
    const verdict = compareFrames(`${ctx.outDir}/stills/${base.file}`, `${dir}/${r.file}`);
    frames.push({ frame: r.frame, scene: r.scene, same: verdict.same, psnr: verdict.metrics?.psnr ?? null });
    if (verdict.same === "different") {
      const m = verdict.metrics!;
      errors.push({
        code: "VERIFY_DIFF",
        path: `${r.scene} f${r.frame}`,
        message: `Frame render berbeda dari still yang di-approve: PSNR ${m.psnr} dB, ${(m.pixels_over_32 * 100).toFixed(3)}% piksel > 32 level, selisih maks ${m.max_level}.`,
        hint: "Ada perubahan yang nyata sejak approval. Jalankan reel:stills dan approve ulang.",
      });
    }
  }
  mkdirSync(ctx.outDir, { recursive: true });
  writeFileSync(
    `${ctx.outDir}/frames.hash.json`,
    JSON.stringify({ at: new Date().toISOString(), frames }, null, 2) + "\n",
  );
  return { errors, frames };
}

export type RenderRecord = {
  mp4: string;
  mp4Sha256: string;
  bytes: number;
  approvalSha256: string;
  seconds: number;
  at: string;
};

export async function renderReel(
  ctx: Ctx,
  session: Session,
  spec: unknown,
  timing: unknown,
  options: { concurrency?: number | null } = {},
): Promise<RenderRecord> {
  const inputProps = { spec, timing, debugSafeZone: false, timeline: null };
  const composition = await selectComposition({
    serveUrl: session.serveUrl,
    id: "Reel01",
    inputProps,
    puppeteerInstance: session.browser,
    logLevel: "error",
  });
  const tooLong = lintDuration(composition.durationInFrames / composition.fps, ctx.golden);
  if (tooLong.length) throw new Error(JSON.stringify({ ok: false, errors: tooLong }, null, 2));
  const output = `${ctx.outDir}/${ctx.id}.mp4`;
  mkdirSync(ctx.outDir, { recursive: true });
  const started = Date.now();
  await renderMedia({
    composition,
    serveUrl: session.serveUrl,
    outputLocation: output,
    inputProps,
    puppeteerInstance: session.browser,
    concurrency: options.concurrency ?? null,
    overwrite: true,
    logLevel: "error",
    ...ENCODING,
  });
  const record: RenderRecord = {
    mp4: `out/${ctx.id}/${ctx.id}.mp4`,
    mp4Sha256: createHash("sha256").update(readFileSync(output)).digest("hex"),
    bytes: statSync(output).size,
    approvalSha256: createHash("sha256")
      .update(readFileSync(approvalPath(ctx)))
      .digest("hex"),
    seconds: Math.round((Date.now() - started) / 100) / 10,
    at: new Date().toISOString(),
  };
  writeFileSync(`${ctx.outDir}/render.json`, JSON.stringify(record, null, 2) + "\n");
  return record;
}
