/**
 * npm run test:negative
 *
 * Every error code must have a malicious spec that fails with exactly that
 * code. A rule without a test is not finished. Each case mutates a copy of the
 * Reel01 golden spec. Positive controls must pass.
 */
import { spec as golden } from "../src/reels/specs/_golden/reel01.ts";
import goldenTiming from "../src/reels/specs/_golden/reel01.timing.json" with { type: "json" };
import { checkSpec } from "./lib/check-spec.ts";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { REPO_ROOT } from "./lib/brief.ts";
import { briefGate, checkReel, kitFiles, scanNondeterminism, translateProbeError } from "./lib/check-reel.ts";
import { lintDuration, lintFit, openFitSession } from "./lib/fit-probe.ts";
import { lintMotion } from "./lib/motion-lint.ts";
import { checkAssets, sha256File } from "./lib/assets.ts";
import { buildTimingFromCues, lintTiming, proposeTiming, type SceneAnalysis } from "./lib/timing.ts";
import { lintVo } from "./lib/vo.ts";
import { SCENE_IDS, type ReelTiming, type TimedSceneId } from "../src/reels/contract/timing-types.ts";
import { createHash } from "node:crypto";
import { currentState, deriveGates, reelContext, requireGate, verifyApproval, writeApproval } from "./lib/pipeline.ts";

type Mutable = any; // eslint-disable-line -- fixtures poke at arbitrary spec fields on purpose
const clone = (): Mutable => structuredClone(golden);
const CP = String.fromCodePoint;
const NUMBERS = new Set(["2027"]);
const set = (path: (s: Mutable) => Mutable, text: string) => (s: Mutable) => {
  path(s).text = text;
};
const first = (s: Mutable) => s.numpang.line[1][0];

const negatives: { name: string; code: string; mutate: (s: Mutable) => void; numbers?: ReadonlySet<string> | null }[] =
  [
    { name: "emoji", code: "CHAR_FORBIDDEN", mutate: set(first, "Kamu " + CP(0x1f600)) },
    { name: "zero-width space", code: "CHAR_FORBIDDEN", mutate: set(first, "Kamu" + CP(0x200b) + "cuma") },
    { name: "variation selector", code: "CHAR_FORBIDDEN", mutate: set(first, "Kamu" + CP(0xfe0f)) },
    { name: "homoglyph (Cyrillic a)", code: "CHAR_FORBIDDEN", mutate: set(first, "K" + CP(0x0430) + "mu") },
    { name: "not NFC (combining accent)", code: "CHAR_FORBIDDEN", mutate: set(first, "Kame" + CP(0x0301)) },
    { name: "tone markup characters", code: "CHAR_FORBIDDEN", mutate: set(first, "**Kamu**") },
    { name: "emoji in the id", code: "ID_INVALID", mutate: (s) => void (s.id = "reel" + CP(0x1f600)) },
    { name: "forbidden phrase", code: "PHRASE_FORBIDDEN", mutate: set(first, "Tinggalkan marketplace") },
    { name: "forbidden phrase, other case", code: "PHRASE_FORBIDDEN", mutate: set(first, "NYEWA LAPAK") },
    {
      name: "forbidden phrase split across segments",
      code: "PHRASE_FORBIDDEN",
      mutate: (s) =>
        void (s.numpang.line[1] = [
          { text: "pindah", tone: "quiet" },
          { text: "marketplace", tone: "strong" },
        ]),
    },
    { name: "invented number", code: "NUMBER_NOT_IN_BRIEF", mutate: set(first, "Untung 9999"), numbers: NUMBERS },
    { name: "invented price", code: "NUMBER_NOT_IN_BRIEF", mutate: set(first, "Rp150.000"), numbers: NUMBERS },
    {
      name: "number in the spec but brief lists none",
      code: "NUMBER_NOT_IN_BRIEF",
      mutate: () => {},
      numbers: new Set(),
    },
    { name: "line break in text", code: "LINEBREAK_FORBIDDEN", mutate: set(first, "Kamu\ncuma") },
    { name: "two accent segments", code: "ACCENT_INVALID", mutate: (s) => void (s.numpang.line[0][0].tone = "accent") },
    {
      name: "too many words",
      code: "PRESET_VIOLATION",
      mutate: set(first, "satu dua tiga empat lima enam tujuh delapan sembilan"),
    },
    { name: "unknown key (position)", code: "PRESET_VIOLATION", mutate: (s) => void (s.hook.x = 10) },
    { name: "unknown key (colour)", code: "PRESET_VIOLATION", mutate: (s) => void (s.numpang.color = "#fff") },
    { name: "wrong contract version", code: "CONTRACT_MISMATCH", mutate: (s) => void (s.contractVersion = "0.9.0") },
    { name: "wrong phrase count in a slot", code: "PRESET_VIOLATION", mutate: (s) => void s.cta.phrases.pop() },
    { name: "unknown tone", code: "SCHEMA_INVALID", mutate: (s) => void (s.numpang.line[0][0].tone = "huge") },
  ];

const positives: { name: string; mutate: (s: Mutable) => void; numbers?: ReadonlySet<string> | null }[] = [
  { name: "typographic apostrophe", mutate: set(first, "Kamu" + CP(0x2019) + "s"), numbers: null },
  { name: "em dash and ellipsis", mutate: set(first, "Kamu" + CP(0x2014) + "cuma" + CP(0x2026)), numbers: null },
  {
    name: "accented Latin letters",
    mutate: set(first, "Caf" + CP(0x00e9) + " r" + CP(0x00e9) + "sum" + CP(0x00e9)),
    numbers: null,
  },
  { name: "golden Reel01 (exempt from numbers)", mutate: () => {}, numbers: null },
  { name: "golden Reel01, 2027 listed in the brief", mutate: () => {}, numbers: NUMBERS },
  {
    name: "every allowed punctuation character",
    mutate: (s) => {
      s.numpang.line[1][0].text = "(a/b):+100%;'x'";
      s.numpang.line[1][1].text = 'ya?!-"ok",.';
    },
    numbers: new Set(["100", "2027"]),
  },
];

let failed = 0;
const report = (ok: boolean, line: string) => {
  if (!ok) failed++;
  console.log(`${ok ? "ok   " : "GAGAL"} ${line}`);
};

for (const item of negatives) {
  const s = clone();
  item.mutate(s);
  const codes = checkSpec(s, item.numbers === undefined ? null : item.numbers).map((e) => e.code);
  report(
    codes.includes(item.code),
    `${item.code.padEnd(20)} ${item.name}${codes.includes(item.code) ? "" : `  (dapat: ${codes.join(",") || "lolos"})`}`,
  );
}
for (const item of positives) {
  const s = clone();
  item.mutate(s);
  const errors = checkSpec(s, item.numbers === undefined ? null : item.numbers);
  report(
    errors.length === 0,
    `LOLOS                ${item.name}${errors.length ? "  (error: " + errors.map((e) => e.code + "@" + e.path).join(",") + ")" : ""}`,
  );
}

/* FIT needs a browser: one session for all cases. */
const fitNegatives: { name: string; mutate: (s: Mutable) => void }[] = [
  {
    name: "sentence too wide for the safe zone",
    mutate: (s) =>
      void (s.numpang.line = [[{ text: "Pembeli langsung masuk ke website kamu sendiri", tone: "quiet" }]]),
  },
  {
    name: "hook line so long the hook shrinks below Reel01",
    mutate: (s) => void (s.hook.hook = [[{ text: "Jangan biarin toko kamu mati sekarang juga", tone: "strong" }]]),
  },
  { name: "STOP word wider than STOP.", mutate: (s) => void (s.hook.stop = "STOPPPPPPPP.") },
  { name: "NAIK word wider than NAIK", mutate: (s) => void (s.reasons.biaya.punch = "NAIKKKKKKKKK") },
];
const fitSession = await openFitSession();
try {
  for (const item of fitNegatives) {
    const s = clone();
    item.mutate(s);
    const errors = checkSpec(s, null);
    const codes = errors.length
      ? errors.map((e) => e.code)
      : lintFit(await fitSession.measure(s, goldenTiming)).map((e) => e.code);
    report(
      codes.includes("FIT_LINE_OVERFLOW"),
      `FIT_LINE_OVERFLOW      ${item.name}${codes.includes("FIT_LINE_OVERFLOW") ? "" : `  (dapat: ${codes.join(",") || "lolos"})`}`,
    );
    negatives.push({ name: item.name, code: "FIT_LINE_OVERFLOW", mutate: item.mutate });
  }
  const goldenFit = lintFit(await fitSession.measure(clone(), goldenTiming));
  report(
    goldenFit.length === 0,
    `LOLOS                golden Reel01 fit${goldenFit.length ? "  (error: " + goldenFit.map((e) => e.path).join(",") + ")" : ""}`,
  );
} finally {
  await fitSession.close();
}

/* ---- Stage C: motion, safe zone, timing, determinism, brief gate ---- */
const finding = (code: "HOLD_TOO_SHORT" | "SAFE_ZONE_VIOLATION", path: string, message: string) => ({
  code,
  path,
  message,
});
const okMetrics = { maxConcurrentEntrances: 4, minHoldFrames: 7, sentences: 33 };
const motionCases: { name: string; code: string; codes: string[] }[] = [
  {
    name: "hold shorter than Reel01 in an S8 beat (6 f < 7 f)",
    code: "HOLD_TOO_SHORT",
    codes: lintMotion({
      metrics: okMetrics,
      findings: [finding("HOLD_TOO_SHORT", "s8b Sekali tap,", "s8b Sekali tap,: hold is 6 f, minimum 15")],
    }).map((e) => e.code),
  },
  {
    name: "hold below the 15 f floor outside the S8 exceptions",
    code: "HOLD_TOO_SHORT",
    codes: lintMotion({
      metrics: okMetrics,
      findings: [finding("HOLD_TOO_SHORT", "s9 tetap jalan,", "s9 tetap jalan,: hold is 14 f, minimum 15")],
    }).map((e) => e.code),
  },
  {
    name: "negative hold (the next word starts before this one settles)",
    code: "HOLD_TOO_SHORT",
    codes: lintMotion({
      metrics: okMetrics,
      findings: [finding("HOLD_TOO_SHORT", "s8b Sekali tap,", "s8b Sekali tap,: hold is -2 f, minimum 15")],
    }).map((e) => e.code),
  },
  {
    name: "more words entering at once than Reel01 (5 > 4)",
    code: "MOTION_BUDGET",
    codes: lintMotion({ metrics: { ...okMetrics, maxConcurrentEntrances: 5 }, findings: [] }).map((e) => e.code),
  },
];
for (const item of motionCases) {
  report(item.codes.includes(item.code), `${item.code.padEnd(20)} ${item.name}`);
  negatives.push({ name: item.name, code: item.code, mutate: () => {} });
}
const sameAsReel01 = lintMotion({
  metrics: okMetrics,
  findings: [finding("HOLD_TOO_SHORT", "s8b Sekali tap,", "s8b Sekali tap,: hold is 7 f, minimum 15")],
});
report(sameAsReel01.length === 0, "LOLOS                hold equal to Reel01's own (7 f in s8b)");

const nondeterministic = scanNondeterminism([
  { path: "kit.ts", text: "const x = Math.random();\nconst t = Date.now();" },
]);
report(
  nondeterministic.length === 2 && nondeterministic.every((e) => e.code === "NONDETERMINISTIC_API"),
  "NONDETERMINISTIC_API  Math.random and Date.now in code",
);
negatives.push({ name: "Math.random and Date.now in code", code: "NONDETERMINISTIC_API", mutate: () => {} });
const mentioned = scanNondeterminism([
  { path: "kit.ts", text: '// never use Math.random()\nconst note = "Date.now() is banned";' },
]);
report(mentioned.length === 0, "LOLOS                mentions in a comment or a string are not flagged");
const kitClean = scanNondeterminism(kitFiles());
report(
  kitClean.length === 0,
  `LOLOS                the kit has no non-deterministic calls${kitClean.length ? "  (" + kitClean.map((e) => e.path).join(",") + ")" : ""}`,
);

const noBrief = briefGate("tidak-ada-slug-ini").errors.map((e) => e.code);
report(noBrief.includes("BRIEF_NOT_APPROVED"), "BRIEF_NOT_APPROVED    reel without a brief folder");
negatives.push({ name: "reel without a brief folder", code: "BRIEF_NOT_APPROVED", mutate: () => {} });

const probe = await openFitSession();
try {
  const wide = clone();
  wide.numpang.line = [[{ text: "Pembeli langsung masuk ke website kamu sendiri", tone: "quiet" }]];
  const safe = lintMotion(await probe.motion(wide, goldenTiming)).map((e) => e.code);
  report(
    safe.includes("SAFE_ZONE_VIOLATION"),
    `SAFE_ZONE_VIOLATION   line too wide for the safe zone${safe.includes("SAFE_ZONE_VIOLATION") ? "" : `  (dapat: ${safe.join(",") || "lolos"})`}`,
  );
  negatives.push({ name: "line too wide for the safe zone", code: "SAFE_ZONE_VIOLATION", mutate: () => {} });

  const fewer = clone();
  fewer.numpang.line = [[{ text: "Toko kamu cuma numpang di platform", tone: "quiet" }]];
  let timing = "tidak error";
  try {
    await probe.motion(fewer, goldenTiming);
  } catch (error) {
    timing = translateProbeError(error).code;
  }
  report(
    timing === "WORD_TIMING_MISMATCH",
    `WORD_TIMING_MISMATCH  phrase with fewer words than its timing${timing === "WORD_TIMING_MISMATCH" ? "" : `  (dapat: ${timing})`}`,
  );
  negatives.push({ name: "phrase with fewer words than its timing", code: "WORD_TIMING_MISMATCH", mutate: () => {} });

  for (const id of ["reel01", "demo-variasi"]) {
    const result = await checkReel(id, probe);
    report(
      result.ok,
      `LOLOS                reel:check ${id}${result.ok ? "" : "  (" + result.errors.map((e) => e.code + "@" + e.path).join(",") + ")"}`,
    );
  }
} finally {
  await probe.close();
}

/* ---- Stage D: state machine and approval seal, on a throwaway repo ---- */
{
  const root = mkdtempSync(join(tmpdir(), "reel-approval-"));
  const put = (rel: string, text: string) => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  };
  const files: Record<string, string> = {
    "src/reels/specs/_golden/t.ts": "export const spec = { a: 1 };",
    "src/reels/contract/schema.ts": "export const v = 1;",
    "src/reels/kit.tsx": "export const kit = 1;",
    "src/theme/t.ts": "export const t = 1;",
    "src/index.ts": "export {};",
    "src/Root.tsx": "export {};",
    "remotion.config.ts": "export {};",
    "package-lock.json": "{}",
    "public/reels/vo_reels_1_el/a.wav": "voice",
    "public/fonts/f.woff2": "font",
    "public/reels/reel01-pack/reel01/products/p.png": "image",
    "public/reels/_shared/manifest.json": "{}",
    "scripts/lib/check.ts": "export const c = 1;",
    "scripts/reel-check.ts": "export {};",
    "out/t/contact.png": "sheet",
    "out/t/stills.json": "{}",
  };
  const reset = () => Object.entries(files).forEach(([rel, text]) => put(rel, text));
  const V = "1.0.0";
  try {
    reset();
    // The context reads the spec location when it is made, so make it after the files exist (the CLI does the same).
    const ctx = reelContext("t", root);
    const none = verifyApproval(ctx, V).map((e) => e.code);
    report(none.includes("APPROVAL_MISSING"), "APPROVAL_MISSING      no approval file");
    negatives.push({ name: "no approval file", code: "APPROVAL_MISSING", mutate: () => {} });

    writeApproval(ctx, "Tester", V);
    const fresh = verifyApproval(ctx, V);
    report(
      fresh.length === 0,
      `LOLOS                approval matches the files it sealed${fresh.length ? "  (" + fresh.map((e) => e.path).join(",") + ")" : ""}`,
    );

    const staleCases: { name: string; group: string; change: () => void }[] = [
      {
        name: "spec edited after approval",
        group: "spec",
        change: () => put("src/reels/specs/_golden/t.ts", "export const spec = { a: 2 };"),
      },
      {
        name: "kit file edited after approval",
        group: "kit",
        change: () => put("src/reels/kit.tsx", "export const kit = 2;"),
      },
      {
        name: "new kit file added after approval",
        group: "kit",
        change: () => put("src/reels/extra.tsx", "export const x = 1;"),
      },
      {
        name: "lockfile changed after approval",
        group: "kit",
        change: () => put("package-lock.json", '{"changed":true}'),
      },
      {
        name: "contract edited after approval",
        group: "contract",
        change: () => put("src/reels/contract/schema.ts", "export const v = 2;"),
      },
      {
        name: "checker script edited after approval",
        group: "checker",
        change: () => put("scripts/lib/check.ts", "export const c = 2;"),
      },
      {
        name: "voice-over file replaced after approval",
        group: "assets",
        change: () => put("public/reels/vo_reels_1_el/a.wav", "other voice"),
      },
      {
        name: "asset added after approval",
        group: "assets",
        change: () => put("public/reels/vo_reels_1_el/b.wav", "new"),
      },
      {
        name: "product image replaced after approval",
        group: "assets",
        change: () => put("public/reels/reel01-pack/reel01/products/p.png", "other image"),
      },
      {
        name: "manifest edited after approval",
        group: "assets",
        change: () => put("public/reels/_shared/manifest.json", '{"x":1}'),
      },
      {
        name: "font replaced after approval",
        group: "assets",
        change: () => put("public/fonts/f.woff2", "other font"),
      },
      {
        name: "contact sheet replaced after approval",
        group: "evidence",
        change: () => put("out/t/contact.png", "different sheet"),
      },
    ];
    for (const item of staleCases) {
      reset();
      writeApproval(ctx, "Tester", V);
      item.change();
      const errors = verifyApproval(ctx, V);
      const hit = errors.some((e) => e.code === "APPROVAL_STALE" && e.path === item.group);
      report(
        hit,
        `APPROVAL_STALE        ${item.name}${hit ? "" : `  (dapat: ${errors.map((e) => e.code + "@" + e.path).join(",") || "lolos"})`}`,
      );
      negatives.push({ name: item.name, code: "APPROVAL_STALE", mutate: () => {} });
    }

    reset();
    writeApproval(ctx, "Tester", V);
    const versionErrors = verifyApproval(ctx, "2.0.0");
    report(
      versionErrors.some((e) => e.code === "APPROVAL_STALE" && e.path === "contractVersion"),
      "APPROVAL_STALE        contract version bumped after approval",
    );

    // A forged state log must not move the pipeline: gates are derived from evidence.
    reset();
    rmSync(join(root, "out/t/APPROVED"), { force: true });
    put("out/t/state.json", JSON.stringify({ state: "APPROVED", history: [] }));
    const forged = currentState(deriveGates(ctx, V));
    report(
      forged !== "APPROVED" && forged !== "RENDERED",
      `LOLOS                a state.json that claims APPROVED changes nothing (derived: ${forged})`,
    );

    // A forged APPROVED file with made-up hashes must be rejected.
    put(
      "out/t/APPROVED",
      JSON.stringify({
        version: 1,
        id: "t",
        approvedBy: "Forger",
        approvedAt: "2026-01-01",
        binding: {
          contractVersion: V,
          groups: {
            spec: { "src/reels/specs/_golden/t.ts": "0".repeat(64) },
            brief: {},
            assets: {},
            kit: {},
            contract: {},
            checker: {},
            evidence: {},
          },
        },
      }),
    );
    const forgedApproval = verifyApproval(ctx, V);
    report(
      forgedApproval.some((e) => e.code === "APPROVAL_STALE"),
      "APPROVAL_STALE        a hand-written APPROVED file with made-up hashes",
    );

    // Gates: a command that needs a later state refuses until the earlier gates hold.
    reset();
    rmSync(join(root, "out/t/APPROVED"), { force: true });
    const blocked = requireGate(ctx, "STILLS_READY", "reel:approve", V);
    report(
      blocked?.code === "GATE_NOT_PASSED" && blocked.path === "VO_READY",
      `GATE_NOT_PASSED       reel:approve for a reel with no timing sidecar${blocked ? "" : "  (lolos)"}`,
    );
    negatives.push({
      name: "reel:approve for a reel with no timing sidecar",
      code: "GATE_NOT_PASSED",
      mutate: () => {},
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

/* ---- Stage E: voice-over, timing, assets ---- */
{
  const root = mkdtempSync(join(tmpdir(), "reel-e-"));
  const put = (rel: string, data: string | Buffer) => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), data);
  };
  /** A silent PCM WAV with a real header, so wavInfo reads it like a recording. */
  const makeWav = (sampleRate: number, channels: number, seconds: number) => {
    const bytes = Math.round(seconds * sampleRate) * channels * 2;
    const head = Buffer.alloc(44);
    head.write("RIFF", 0);
    head.writeUInt32LE(36 + bytes, 4);
    head.write("WAVEfmt ", 8);
    head.writeUInt32LE(16, 16);
    head.writeUInt16LE(1, 20);
    head.writeUInt16LE(channels, 22);
    head.writeUInt32LE(sampleRate, 24);
    head.writeUInt32LE(sampleRate * channels * 2, 28);
    head.writeUInt16LE(channels * 2, 32);
    head.writeUInt16LE(16, 34);
    head.write("data", 36);
    head.writeUInt32LE(bytes, 40);
    return Buffer.concat([head, Buffer.alloc(bytes)]);
  };
  const sha = (data: Buffer | string) => createHash("sha256").update(data).digest("hex");
  const expect = (cond: boolean, name: string, code: string, got: string[] = []) => {
    report(cond, `${code.padEnd(20)} ${name}${cond ? "" : `  (dapat: ${got.join(",") || "lolos"})`}`);
    if (code !== "LOLOS") negatives.push({ name, code, mutate: () => {} });
  };
  try {
    // ---- voice-over preparation
    const vo = join(root, "public/reels/t/vo");
    put("public/reels/t/vo/s1.wav", makeWav(48000, 1, 1));
    expect(
      lintVo(vo).some((e) => e.code === "VO_NOT_NORMALIZED"),
      "VO with no prep.json",
      "VO_NOT_NORMALIZED",
      lintVo(vo).map((e) => e.code),
    );
    const prep = (file: string, data: Buffer) =>
      put(
        "public/reels/t/vo/prep.json",
        JSON.stringify({ version: 1, targetLufs: -16, files: { [file]: { sha256: sha(data) } } }),
      );
    prep("s1.wav", makeWav(48000, 1, 1));
    report(lintVo(vo).length === 0, "LOLOS                VO listed in prep.json with the same hash");
    put("public/reels/t/vo/s1.wav", makeWav(48000, 1, 2));
    expect(
      lintVo(vo).some((e) => e.code === "VO_NOT_NORMALIZED"),
      "VO replaced after reel:vo-prep",
      "VO_NOT_NORMALIZED",
    );
    put("public/reels/t/vo/s1.wav", makeWav(44100, 2, 1));
    prep("s1.wav", makeWav(44100, 2, 1));
    expect(
      lintVo(vo).some((e) => e.code === "VO_NOT_NORMALIZED"),
      "VO that is 44.1 kHz stereo",
      "VO_NOT_NORMALIZED",
    );

    // ---- timing sidecar
    const legacy = goldenTiming as unknown as ReelTiming;
    const fresh = (): ReelTiming => structuredClone(legacy);
    // A fake recording per scene, as long as the timing says it is.
    const record = (t: ReelTiming) =>
      SCENE_IDS.forEach((scene) =>
        put(`public/${t.voDir}/${t.scenes[scene].file}`, makeWav(48000, 1, t.scenes[scene].expectedSeconds)),
      );
    record(legacy);
    const lint = (t: ReelTiming, golden = true, cuesText: string | null = null) =>
      lintTiming(t, { root, golden, cuesText }).map((e) => e.code);

    report(
      lint(fresh()).length === 0,
      `LOLOS                Reel01's legacy timing, as a golden spec${lint(fresh()).length ? "  (" + lint(fresh()).join(",") + ")" : ""}`,
    );
    const noScene = fresh();
    delete (noScene.scenes as Partial<typeof noScene.scenes>).s3;
    expect(lint(noScene).includes("CUE_UNKNOWN"), "timing missing a scene", "CUE_UNKNOWN", lint(noScene));
    const extra = fresh();
    extra.words["invented.phrase"] = [1, 2];
    expect(
      lint(extra).includes("CUE_UNKNOWN"),
      "timing with a word group the preset does not have",
      "CUE_UNKNOWN",
      lint(extra),
    );
    const wrongCount = fresh();
    wrongCount.scenes.s1.cues = [0, 1];
    expect(
      lint(wrongCount).includes("CUE_UNKNOWN"),
      "scene with the wrong number of cues",
      "CUE_UNKNOWN",
      lint(wrongCount),
    );
    const unordered = fresh();
    unordered.scenes.s1.cues = [0, 2.6, 0.9];
    expect(lint(unordered).includes("CUE_ORDER"), "cues out of order", "CUE_ORDER", lint(unordered));
    const wordsUnordered = fresh();
    wordsUnordered.words["hook.question"] = [1.6, 1.2, 1.0, 0.9];
    expect(lint(wordsUnordered).includes("CUE_ORDER"), "word times out of order", "CUE_ORDER", lint(wordsUnordered));
    const beyond = fresh();
    beyond.scenes.s2.cues = [9];
    expect(
      lint(beyond).includes("CUE_OUT_OF_RANGE"),
      "cue beyond the end of the recording",
      "CUE_OUT_OF_RANGE",
      lint(beyond),
    );
    const wrongLength = fresh();
    wrongLength.scenes.s2.expectedSeconds = 9;
    expect(
      lint(wrongLength).includes("CUE_OUT_OF_RANGE"),
      "timing records a different recording length",
      "CUE_OUT_OF_RANGE",
      lint(wrongLength),
    );
    const noFile = fresh();
    noFile.scenes.s4.file = "missing.wav";
    expect(lint(noFile).includes("VO_MISSING"), "scene points at a file that is not there", "VO_MISSING", lint(noFile));
    expect(
      lint(fresh(), false).includes("TIMING_NOT_CONFIRMED"),
      "legacy timing on a spec that is not golden",
      "TIMING_NOT_CONFIRMED",
      lint(fresh(), false),
    );

    // A real chain: suggestion -> confirmed sidecar. Then each way to break it.
    const analyses = {} as Record<TimedSceneId, SceneAnalysis>;
    for (const scene of SCENE_IDS) {
      const seconds = legacy.scenes[scene].expectedSeconds;
      analyses[scene] = { file: legacy.scenes[scene].file, seconds, segments: [{ start: 0.05, end: seconds - 0.1 }] };
    }
    const cuesText = JSON.stringify(proposeTiming("t", legacy.voDir, analyses, golden), null, 2);
    const confirmed = buildTimingFromCues(cuesText, "Tester");
    const confirmedErrors = lint(confirmed, false, cuesText);
    report(
      confirmedErrors.length === 0,
      `LOLOS                timing confirmed from cues.json${confirmedErrors.length ? "  (" + confirmedErrors.join(",") + ")" : ""}`,
    );
    expect(
      lint(confirmed, false, null).includes("TIMING_NOT_CONFIRMED"),
      "confirmed timing but cues.json is gone",
      "TIMING_NOT_CONFIRMED",
      lint(confirmed, false, null),
    );
    expect(
      lint(confirmed, false, cuesText + " ").includes("TIMING_NOT_CONFIRMED"),
      "cues.json changed after confirmation",
      "TIMING_NOT_CONFIRMED",
      lint(confirmed, false, cuesText + " "),
    );
    const handEdited = structuredClone(confirmed);
    handEdited.words["hook.question"] = handEdited.words["hook.question"].map(
      (t) => Math.round((t + 0.07) * 100) / 100,
    );
    expect(
      lint(handEdited, false, cuesText).includes("TIMING_NOT_CONFIRMED"),
      "word times edited by hand after confirmation",
      "TIMING_NOT_CONFIRMED",
      lint(handEdited, false, cuesText),
    );
    const noName = structuredClone(confirmed);
    delete noName.confirmedBy;
    expect(
      lint(noName, false, cuesText).includes("TIMING_NOT_CONFIRMED"),
      "no human name on the confirmation",
      "TIMING_NOT_CONFIRMED",
      lint(noName, false, cuesText),
    );

    // ---- gates: with a valid timing sidecar, the first thing that blocks approval is reel:check
    put("src/reels/specs/_golden/t.ts", "export const spec = {};");
    put("src/reels/specs/_golden/t.timing.json", JSON.stringify(legacy));
    const gate = requireGate(reelContext("t", root), "STILLS_READY", "reel:approve", "1.0.0");
    expect(
      gate?.code === "GATE_NOT_PASSED" && gate.path === "CHECKED",
      "reel:approve before reel:check",
      "GATE_NOT_PASSED",
      [gate?.code + "@" + gate?.path],
    );

    // ---- assets
    put("public/fonts/f.woff2", "font");
    put("public/reels/reel01-pack/reel01/products/p.png", "image");
    const entry = (id: string, type: string, path: string) => ({
      id,
      type,
      path,
      license: "TODO",
      sha256: sha256File(join(root, path)),
      usedIn: [],
    });
    const writeManifest = (assets: object[]) =>
      put("public/reels/_shared/manifest.json", JSON.stringify({ version: 1, assets }));
    writeManifest([
      entry("font-f", "font", "public/fonts/f.woff2"),
      entry("product-p", "product", "public/reels/reel01-pack/reel01/products/p.png"),
    ]);
    report(checkAssets(root).length === 0, "LOLOS                every kit asset is in the manifest with its hash");
    put("public/reels/reel01-pack/reel01/products/new.png", "an image a model made");
    expect(
      checkAssets(root).some((e) => e.code === "ASSET_UNKNOWN"),
      "image added to the kit's asset folder, not in the manifest",
      "ASSET_UNKNOWN",
      checkAssets(root).map((e) => e.code),
    );
    rmSync(join(root, "public/reels/reel01-pack/reel01/products/new.png"));
    put("public/fonts/f.woff2", "another font");
    expect(
      checkAssets(root).some((e) => e.code === "ASSET_HASH_MISMATCH"),
      "manifest asset replaced with different bytes",
      "ASSET_HASH_MISMATCH",
      checkAssets(root).map((e) => e.code),
    );
    rmSync(join(root, "public/fonts/f.woff2"));
    expect(
      checkAssets(root).some((e) => e.code === "ASSET_HASH_MISMATCH"),
      "manifest asset deleted",
      "ASSET_HASH_MISMATCH",
      checkAssets(root).map((e) => e.code),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }

  // A spec with no timing sidecar. The spec file is removed again whatever happens.
  const stray = `${REPO_ROOT}/src/reels/specs/zz-no-timing.ts`;
  writeFileSync(
    stray,
    readFileSync(`${REPO_ROOT}/src/reels/specs/_golden/reel01.ts`, "utf8")
      .replace("../../contract", "../contract")
      .replace('id: "reel01"', 'id: "zz-no-timing"'),
  );
  try {
    const result = await checkReel("zz-no-timing", {
      measure: async () => [],
      duration: async () => 30,
      motion: async () => ({ metrics: { maxConcurrentEntrances: 0, minHoldFrames: 0, sentences: 0 }, findings: [] }),
    } as never);
    const codes = result.errors.map((e) => e.code);
    expect(codes.includes("TIMING_MISSING"), "spec without a timing sidecar", "TIMING_MISSING", codes);
  } finally {
    rmSync(stray, { force: true });
  }
}

/* ---- Render verification (VERIFY_DIFF) ---- */
{
  const { compareFrames, measureDiff, withinTolerance } = await import("./lib/image-compare.ts");
  const { verifyAgainstApproved } = await import("./lib/render.ts");
  const frame = (n: string) => `${REPO_ROOT}/out/baseline/frame-${n}.png`;
  const expect = (cond: boolean, name: string, got = "") => {
    report(cond, `VERIFY_DIFF          ${name}${cond ? "" : `  (dapat: ${got})`}`);
    negatives.push({ name, code: "VERIFY_DIFF", mutate: () => {} });
  };

  // 1. Two different frames of the same reel are a real difference.
  const different = compareFrames(frame("0000"), frame("0057"));
  expect(different.same === "different", "two different frames are never accepted as the same", different.same);
  // 2. A frame against itself is identical; the tolerance accepts measured noise but not a changed word.
  report(compareFrames(frame("0057"), frame("0057")).same === "identical", "LOLOS                a frame against itself is identical");
  const limits = { psnrMin: 45, over32Max: 0.001, maxLevel: 80 };
  const m = measureDiff(frame("0000"), frame("0057"));
  report(!withinTolerance(m, limits), "LOLOS                tolerance rejects frames that really differ");
  report(
    withinTolerance({ ...m, psnr: 50.8, pixels_over_32: 0.0004, max_level: 70 }, limits) &&
      !withinTolerance({ ...m, psnr: 30, pixels_over_32: 0.01, max_level: 255 }, limits),
    "LOLOS                tolerance: measured noise passes, a one-word change (30 dB) does not",
  );
  // 3. An approved still that is missing makes verification refuse before rendering anything.
  const dir = mkdtempSync(join(tmpdir(), "niskala-verify-"));
  try {
    writeFileSync(
      join(dir, "stills.json"),
      JSON.stringify({ frames: [{ frame: 0, scene: "start", file: "frame-0000.png" }] }),
    );
    const out = await verifyAgainstApproved({ outDir: dir } as never, null as never, {}, {});
    expect(out.errors.some((e) => e.code === "VERIFY_DIFF"), "an approved still is missing", out.errors.map((e) => e.code).join(","));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/* ---- Duration ---- */
{
  const codes = (seconds: number, golden: boolean) => lintDuration(seconds, golden).map((e) => e.code);
  const hit = codes(60, false).includes("DURATION_EXCEEDED");
  report(hit, `DURATION_EXCEEDED    a 60.00 s reel is refused (limit is exclusive)`);
  negatives.push({ name: "a 60.00 s reel", code: "DURATION_EXCEEDED", mutate: () => {} });
  report(codes(59.97, false).length === 0, "LOLOS                59.97 s is accepted");
  report(codes(61.78, true).length === 0, "LOLOS                a golden reference (Reel01, 61.78 s) is exempt");
}

/* ---- The catalog and the fixtures must agree ---- */
const catalog = JSON.parse(readFileSync(`${REPO_ROOT}/src/reels/contract/errors.json`, "utf8")) as Record<
  string,
  { enforced: boolean }
>;
const tested = new Set(negatives.map((n) => n.code));
const missingFixture = Object.keys(catalog).filter(
  (code) => !code.startsWith("_") && catalog[code].enforced && !tested.has(code),
);
const unknownCode = [...tested].filter((code) => !(code in catalog));
report(
  missingFixture.length === 0,
  `LOLOS                every enforced code has a fixture${missingFixture.length ? "  (tanpa fixture: " + missingFixture.join(",") + ")" : ""}`,
);
report(
  unknownCode.length === 0,
  `LOLOS                every tested code is in errors.json${unknownCode.length ? "  (tidak ada di katalog: " + unknownCode.join(",") + ")" : ""}`,
);

const codes = new Set(negatives.map((n) => n.code));
console.log(`\n${negatives.length} kasus negatif, ${codes.size} kode: ${[...codes].join(", ")}`);
console.log(failed === 0 ? "SEMUA LOLOS" : `${failed} GAGAL`);
process.exit(failed === 0 ? 0 : 1);
