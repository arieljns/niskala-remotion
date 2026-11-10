# Grill Gate — Spesifikasi

> Brief dari pemilik (2026-11-10). Sumber kebenaran untuk gerbang wajib "grill dulu" di setiap reel.
> Bagian ini **mengikat semua agent dan anggota tim**. Lihat `AGENT_GUIDE.md` §0.

## Inti aturan

**Tidak ada reel yang boleh disentuh kodenya, scriptnya, atau dirender sebelum orang yang membuatnya diwawancarai habis-habisan dan briefnya disetujui.**

Konteks: tim produksi (bukan cuma pemilik) membuat Reels untuk menarik **seller toko online** ke Niskala. Masalah yang mau dibunuh: LLM jalan otomatis, tim cuma mengeksekusi tanpa ngerti kenapa reel-nya begitu, jadi kalau ada kesalahan mereka nggak bisa memperbaikinya.

## Tujuan

1. **Skill `grill-reel`** mewawancarai pembuat reel sebelum apa pun dibangun → `.claude/skills/grill-reel/SKILL.md` *(sudah dibuat)*.
2. Hasil wawancara = **`brief.md`** yang disetujui secara eksplisit → template di `docs/templates/brief.md` *(sudah dibuat)*.
3. **Gate teknis** supaya pipeline menolak jalan tanpa brief yang disetujui *(belum dibangun, lihat di bawah)*.
4. Pembuat **benar-benar paham** reel-nya lewat tahap *teach-back*, sehingga bisa memperbaiki kesalahan sendiri.

## File

| File | Isi | Status |
|---|---|---|
| `.claude/skills/grill-reel/SKILL.md` | Skill wawancara (aturan mutlak, 7 tahap, rubrik red flag, output, mode debrief). Agent non-Claude: baca file ini langsung dan ikuti isinya. | dibuat |
| `docs/templates/brief.md` | Struktur brief (9 bagian, frontmatter `brief_status`). | dibuat |
| `scripts/new-reel.ts` | Lihat "Gate teknis". | belum |
| `scripts/check-brief.ts` | Lihat "Gate teknis". | belum |

## Gate teknis (yang harus dibangun)

- `scripts/new-reel.ts <slug>`: membuat folder `data/reels/<YYYYMMDD-slug>/` yang **hanya berisi** `brief.md` (status `draft`) dan `meta.json` dengan `brief_status: "draft"`. Jangan scaffold `script.md` dulu.
- `scripts/check-brief.ts <folder>`: lolos hanya jika semua ini benar:
  - `brief.md` ada dan semua field wajib terisi (tidak ada `TODO` tersisa di field wajib),
  - `brief_status` = `approved`,
  - ada baris persetujuan eksplisit dari manusia (nama + tanggal),
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

- [ ] path log iterasi / format hipotesis
- [ ] path file penawaran/pricing untuk cek klaim
- [ ] batas durasi reel (sama dengan SOP)
- [ ] siapa saja yang berhak menyetujui brief (pembuat sendiri atau butuh reviewer kedua)
