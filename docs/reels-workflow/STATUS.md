# Status — Niskala Reels

Aturan: `AGENTS.md`. Ringkasan alur: `docs/WORKFLOW.md`. Riwayat keputusan lama (2026-11-10 sampai 2026-11-17) ada di git history.

## Keputusan

- 2026-11-18: **Workflow v4 (human-in-the-loop) menggantikan workflow lama.** Gerbang manusia: `APPROVE BRIEF/COPY/VO/SHEET`. Reviewer independen (`REVIEWER.md`), caveman hanya untuk chat, aset baru/deviasi token boleh asal ditandai `NEW`/`DEVIASI` dengan alasan (pemilik).
- 2026-11-18: Mesin lama dihapus (pemilik, karena bottleneck): skrip `reel:*`, `approve-brief`, `build-timeline`, `render` lama, `conformance-*`, tes, config brief-gate, docs lama. Sisa: penjaga (`guard:*`), `reel:render4`, `scripts/audio`, `scripts/reel03`, `lib/contact_sheet.py`.
- 2026-11-18: Kode tidak terpakai v4 dihapus: komposisi `ReelFlow`, `RoasDataPembeli`, `FitProbe`, `ReferenceCompare`, folder `src/reels/flow`, `src/reels/specs/roas-data-pembeli*`, spec demo, dan berkas kontrak yang tak diimpor. `src/reels/contract` sisa 3 berkas yang masih dipakai Reel01 (`spec.schema.ts`, `timing-types.ts`, `motion-types.ts`).
- 2026-11-18: Render v4: `npm run reel:render4 -- <id> [composition]`, butuh baris `SHEET` di `out/<id>/approvals.md`.

## TODO pemilik

- [ ] Isi `TODO_THRESHOLD`, `TODO_RUBRIC`, `TODO_TTS`, `TODO_EMOTION_VOCAB`, `TODO_VO_SYNC`.

- 2026-11-18: Dibersihkan (pemilik): folder `out/`, `public/reels/roas-data-pembeli`, `public/reels/_shared`, `data/reels/20261117-roas-data-pembeli`, pola `reel:*` di `config/protected-paths.json` dan `.claude/settings.json`; `test-guard.ts` disesuaikan.
