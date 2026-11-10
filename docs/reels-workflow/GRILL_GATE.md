# Grill Gate — Spesifikasi

> Brief dari pemilik (2026-11-10). Sumber kebenaran untuk gerbang wajib "grill dulu" di setiap reel.
> Bagian ini **mengikat semua agent dan anggota tim**. Lihat `AGENT_GUIDE.md` §0.

## Inti aturan

**Tidak ada reel yang boleh disentuh kodenya, scriptnya, atau dirender sebelum orang yang membuatnya diwawancarai habis-habisan dan briefnya disetujui.**

Konteks: tim produksi (bukan cuma pemilik) membuat Reels untuk menarik **seller toko online** ke Niskala. Masalah yang mau dibunuh: LLM jalan otomatis, tim cuma mengeksekusi tanpa ngerti kenapa reel-nya begitu, jadi kalau ada kesalahan mereka nggak bisa memperbaikinya.

## Tujuan

1. **Skill `grill-reel`** mewawancarai pembuat reel sebelum apa pun dibangun → `.claude/skills/grill-reel/SKILL.md` *(sudah dibuat)*.
2. Hasil wawancara = **`brief.md`** yang disetujui secara eksplisit → template di `docs/templates/brief.md` *(sudah dibuat)*.
3. **Gate teknis** supaya pipeline menolak jalan tanpa brief yang disetujui *(sudah dibangun, `npm run verify-gate` lolos)*.
4. Pembuat **benar-benar paham** reel-nya lewat tahap *teach-back*, sehingga bisa memperbaiki kesalahan sendiri.

## File

| File | Isi | Status |
|---|---|---|
| `.claude/skills/grill-reel/SKILL.md` | Skill wawancara (aturan mutlak, 7 tahap, rubrik red flag, output, mode debrief). Agent non-Claude: baca file ini langsung dan ikuti isinya. | dibuat |
| `docs/templates/brief.md` | Struktur brief (9 bagian, frontmatter `brief_status`). | dibuat |
| `scripts/lib/brief.ts` | Logika gate: kelengkapan field, dua approval, confidence, hash, pencabutan otomatis. | dibuat |
| `config/brief-gate.json` | Batas confidence (sementara: keseluruhan ≥ 50, tiap tahap ≥ 30, maks +5 di atas rata-rata) dan minimal 3 risiko. | dibuat |
| `scripts/new-reel.ts` | Folder reel baru, isi cuma `brief.md` + `meta.json`. | dibuat |
| `scripts/check-brief.ts` | Laporan lolos/gagal. | dibuat |
| `scripts/approve-brief.ts` | Menyegel brief (status, approvals, hash) kalau dua approval + confidence lolos. | dibuat |
| `scripts/scaffold-script.ts` | Bikin `script.md`, dijaga gate. | dibuat |
| `scripts/build-timeline.ts`, `scripts/render.ts` | Gate aktif; isi pipeline-nya Fase 3. | gate saja |
| `scripts/verify-gate.ts` + `scripts/fixtures/brief-complete.md` | Uji otomatis gate. | dibuat |
| `docs/WORKFLOW.md` | Langkah 0 "Grill dulu". | dibuat |

## Gate teknis (yang harus dibangun)

- `scripts/new-reel.ts <slug>`: membuat folder `data/reels/<YYYYMMDD-slug>/` yang **hanya berisi** `brief.md` (status `draft`) dan `meta.json` dengan `brief_status: "draft"`. Jangan scaffold `script.md` dulu.
- `scripts/check-brief.ts <folder>`: lolos hanya jika semua ini benar:
  - `brief.md` ada dan semua field wajib terisi (tidak ada `TODO` tersisa di field wajib),
  - `brief_status` = `approved`,
  - ada **dua** persetujuan eksplisit (keputusan pemilik 2026-11-10): **pembuat reel** (nama + `APPROVE` + tanggal) **dan LLM pilihan pembuat** (model + confidence score 0–100 per tahap + keseluruhan + alasan + `APPROVE` + tanggal),
  - confidence lolos batas di `config/brief-gate.json`: keseluruhan ≥ `minOverallConfidence`, tiap tahap ≥ `minStageConfidence`, keseluruhan tidak lebih dari rata-rata tahap + 5,
  - `brief_hash` di `meta.json` cocok dengan hash isi `brief.md` saat ini (kalau brief diubah setelah approve, status otomatis kembali `draft` dan wajib di-grill ulang).
- `scripts/build-timeline.ts`, `scripts/render.ts`, dan scaffold `script.md` **wajib memanggil `check-brief.ts` di awal dan berhenti dengan pesan jelas jika gagal.** Tidak boleh ada flag untuk melewati gate ini.
- `docs/WORKFLOW.md` langkah 0: "Grill dulu. Tanpa brief approved, tidak ada yang jalan." Perbarui `docs/` lain yang relevan.

## Verifikasi (wajib saat gate dibangun)

1. `new-reel` → coba `render` langsung → harus ditolak dengan pesan yang jelas.
2. Isi brief sebagian → `check-brief` → harus gagal dan menyebut field mana yang kurang.
3. Approve → `check-brief` lolos.
4. Ubah satu kata di brief → `check-brief` harus gagal lagi (hash berubah).
5. Jalankan skill `grill-reel` dengan topik uji dan tunjukkan 5 pertanyaan pertama yang ia ajukan. Nilai sendiri: apakah pertanyaannya spesifik dan kritis, atau generik?

Berhenti dan lapor setelah verifikasi. Jangan membangun hal lain di langkah ini.

Laporan akhir: file yang dibuat/diubah, hasil lima uji verifikasi, 5 pertanyaan pertama dari skill uji beserta penilaian jujur, dan satu risiko terbesar dari gate ini (mis. tim merasa terlalu berat lalu cari jalan memotong).

## TODO pemilik

- [ ] path log iterasi / format hipotesis *(ditunda pemilik 2026-11-10)*
- [ ] path file penawaran/pricing untuk cek klaim *(ditunda pemilik 2026-11-10)*
- [x] batas durasi reel: di bawah 1 menit, dicek gate dari "Target durasi" di brief (2026-11-10)
- [x] yang berhak menyetujui brief: pembuat sendiri + LLM pilihannya, dengan confidence score (2026-11-10)
- [x] batas confidence: sementara rendah, keseluruhan ≥ 50 dan tiap tahap ≥ 30 (2026-11-10). Naikkan di `config/brief-gate.json` kalau tim sudah terbiasa.
