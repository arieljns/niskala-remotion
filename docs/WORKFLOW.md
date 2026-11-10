# Workflow Produksi Reel

Langkah per reel dari ide sampai posting. Peran boleh dirangkap. Nama tim: `TODO` (diisi pemilik).

## Langkah 0: Grill dulu. Tanpa brief approved, tidak ada yang jalan.

| # | Siapa | Lakukan | Perintah |
|---|---|---|---|
| 0a | Pembuat reel | Bikin folder reel. Isinya cuma `brief.md` + `meta.json`. | `npm run new-reel -- <slug>` |
| 0b | Pembuat + LLM | Wawancara `grill-reel` sampai brief lengkap. Claude Code: `/grill-reel`. Agent lain: baca `.claude/skills/grill-reel/SKILL.md`. | |
| 0c | Pembuat + LLM | Cek apa yang masih kurang. Ulangi 0b sampai bersih. | `npm run check-brief -- data/reels/<folder>` |
| 0d | Pembuat | Ketik nama + `APPROVE` di bagian 9 brief. | |
| 0e | LLM pilihan pembuat | Isi confidence score 0–100 per tahap + keseluruhan, alasan skor, lalu `APPROVE`. Batas di `config/brief-gate.json` (sementara rendah: keseluruhan ≥ 50, tiap tahap ≥ 30). | |
| 0f | Pembuat | Segel brief. | `npm run approve-brief -- data/reels/<folder>` |

Aturannya:
- Yang boleh approve: **pembuat reel itu sendiri + LLM pilihannya**. Dua-duanya wajib.
- Confidence di bawah batas = belum boleh approve. Grill ulang tahap yang lemah.
- `scaffold-script`, `build-timeline`, dan `render` mengecek brief dulu dan **menolak jalan** kalau belum approved. Tidak ada flag untuk melewati.
- Brief diubah sedikit pun setelah approve → approval otomatis dicabut, ulangi grill untuk bagian yang berubah lalu approve lagi.
- Ada yang salah setelah render/posting → mode debrief di `grill-reel`, perbaiki brief dulu, baru kode.

## Langkah 1 dan seterusnya

| # | Siapa | Lakukan | Perintah |
|---|---|---|---|
| 1 | Penulis script | Bikin beat sheet dari brief. | `npm run scaffold-script -- data/reels/<folder>` |
| 2 | Voice over | Rekam `vo.wav`. | Fase 3, belum dibangun |
| 3 | Operator render | Transkrip → timeline → render. | `build-timeline`, `render` (gate sudah aktif, isinya Fase 3) |
| 4 | QA | `qa.ts` + `QA_CHECKLIST.md`. | Fase 3 / 5 |
| 5 | Posting & log | Posting, catat ke `data/log.csv`. | Fase 3 |

Langkah 2–5 dilengkapi waktu Fase 3 dan 5 selesai (lihat `docs/reels-workflow/STATUS.md`).

## Cek gate-nya masih jalan

Setelah mengubah `scripts/lib/brief.ts`, template brief, atau `config/brief-gate.json`:

```
npm run verify-gate
```
