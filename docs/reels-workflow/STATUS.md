# Status — Niskala Reels Workflow

Update file ini setiap akhir fase. Agent berikutnya membaca ini untuk tahu posisi terakhir.

## Fase

| Fase | Isi | Status | Catatan |
|---|---|---|---|
| 0 | Audit & rencana (berhenti, tunggu persetujuan) | `next` | Belum dimulai |
| 1 | Tokens & fondasi | `todo` | |
| 2 | Starter Asset Set | `todo` | |
| 3 | Pipeline voice-over-first | `todo` | |
| 4 | Template `SlotReveal` + `ContrarianExplainer` | `todo` | |
| 5 | SOP tim (`docs/`) | `todo` | |
| 6 | Demo end-to-end | `todo` | |

Status: `todo` · `next` · `in-progress` · `blocked` (tulis alasannya) · `done`.

## Keputusan

Format: `YYYY-MM-DD: keputusan (siapa yang memutuskan)`

- 2026-11-10: Brief workflow disimpan di `docs/reels-workflow/BRIEF.md` sebagai sumber kebenaran (pemilik).
- 2026-11-10: Font reels = **Archivo untuk heading, Lexend untuk body**. Menggantikan aturan "Archivo saja" di brief awal (pemilik).
- 2026-11-10: Repo dibersihkan, hanya kode & aset Reels yang disisakan. Explainer lama, NiskalaStory, ChunkOne, dan aset yang tidak dipakai reels dihapus; masih bisa diambil dari git history di commit `1c254ff` (pemilik).

## TODO pemilik (masih terbuka)

- [ ] fps final (30/60) dan safe area px
- [ ] nilai palet Senja jika belum lengkap di repo, plus 2 tema alternatif
- [ ] sumber voice over standar (suara sendiri / anggota tim / TTS) dan target loudness
- [ ] batas durasi reel (min–max)
- [ ] batas detik kemunculan hook (usulan brief: 1.5 dtk)
- [ ] nama & peran anggota tim untuk `WORKFLOW.md`
- [ ] sample `vo.wav` untuk uji pipeline
- [ ] keputusan untuk tiap konflik di `CONFLICTS.md`
