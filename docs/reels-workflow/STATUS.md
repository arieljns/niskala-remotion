# Status — Niskala Reels Workflow

Update file ini setiap akhir fase. Agent berikutnya membaca ini untuk tahu posisi terakhir.

## Fase

| Fase | Isi | Status | Catatan |
|---|---|---|---|
| G | Grill gate: skill + template brief | `done` | `.claude/skills/grill-reel/SKILL.md`, `docs/templates/brief.md` |
| G2 | Grill gate teknis: `new-reel`, `check-brief`, `approve-brief`, gate di scaffold-script/build-timeline/render | `done` | `npm run verify-gate` lolos 8/8. Isi build-timeline & render = Fase 3 |
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
- 2026-11-10: Grill gate wajib untuk setiap reel: tidak ada script/kode/render tanpa `brief.md` approved (pemilik).
- 2026-11-10: Yang berhak approve brief = pembuat reel sendiri + LLM pilihannya, LLM wajib memberi confidence score per tahap + keseluruhan sebelum reel masuk pipeline (pemilik).
- 2026-11-10: Batas confidence **sementara rendah**: keseluruhan ≥ 50, tiap tahap ≥ 30, keseluruhan maks rata-rata tahap + 5 (`config/brief-gate.json`). Dinaikkan nanti (pemilik).
- 2026-11-10: **Reel01 dikecualikan dari grill gate** karena sudah dibuat sebelum gate ada. Revisinya boleh jalan tanpa brief. Tidak berlaku untuk reel lain (pemilik).
- 2026-11-10: **Durasi reel wajib di bawah 1 menit.** Gate menolak brief dengan "Target durasi" ≥ 60 detik (`config/brief-gate.json`); `qa.ts` nanti mengecek durasi render juga. Belum ada batas minimum (pemilik).
- 2026-11-10: Log iterasi dan file pricing ditunda. Sementara grill tidak boleh menyebut harga atau janji hasil (pemilik).
- 2026-11-10: Font reels = **Archivo untuk heading, Lexend untuk body**. Menggantikan aturan "Archivo saja" di brief awal (pemilik).
- 2026-11-10: Repo dibersihkan, hanya kode & aset Reels yang disisakan. Explainer lama, NiskalaStory, ChunkOne, dan aset yang tidak dipakai reels dihapus; masih bisa diambil dari git history di commit `1c254ff` (pemilik).

## TODO pemilik (masih terbuka)

- [ ] path log iterasi / format hipotesis (grill tahap 1) *(ditunda)*
- [ ] path file penawaran/pricing untuk cek klaim (grill tahap 4) *(ditunda)*

- [ ] fps final (30/60) dan safe area px
- [ ] nilai palet Senja jika belum lengkap di repo, plus 2 tema alternatif
- [ ] sumber voice over standar (suara sendiri / anggota tim / TTS) dan target loudness
- [ ] batas detik kemunculan hook (usulan brief: 1.5 dtk)
- [ ] nama & peran anggota tim untuk `WORKFLOW.md`
- [ ] sample `vo.wav` untuk uji pipeline
- [ ] keputusan untuk tiap konflik di `CONFLICTS.md`
