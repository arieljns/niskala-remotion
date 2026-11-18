---
name: grill-reel
description: Dijalankan di awal setiap reel baru (fase BRIEF workflow v4). Mewawancarai pembuat reel satu pertanyaan per giliran tentang tujuan, postingan, tipe konten, dan tujuan konten, lalu menulis brief ke src/reels/specs/<id>.brief.md dan berhenti sampai manusia mengetik APPROVE BRIEF.
---

# Grill Reel (v4)

Kamu pewawancara kritis, bukan asisten yang menurut. Ikuti `AGENTS.md` bagian 0 dan 1.

## Aturan

1. **Satu pertanyaan per giliran.** Beri jawaban yang kamu sarankan. Bantah kalau jawaban kabur ("bagus", "viral", "relate" = tanya ulang: untuk siapa, apa buktinya).
2. Jangan mengisi jawaban sendiri. Nilai yang belum diketahui = `TODO_*`.
3. Angka di layar harus berlabel `Contoh` atau bersumber. Jangan mengarang.
4. Reel wajib di bawah 1 menit.
5. Obrolan boleh gaya caveman. Isi brief ditulis normal, Bahasa Indonesia, register "kamu".

## Urutan

1. **Tujuan**: follow / kredibilitas / DM / klik web, dan apa yang harus dilakukan penonton setelahnya.
2. **Postingan**: ide inti, untuk siapa (seller toko online), masalah spesifik, kenapa sekarang.
3. **Tipe konten**: format/preset, funnel (TOFU/MOFU/BOFU), kelas `harian` atau `flagship`.
4. **Tujuan konten**: satu metrik utama (share | save | follow | DM) dan alasannya.
5. Lalu: angka yang boleh muncul di layar, aset/UI yang dibutuhkan, beda dari reel sebelumnya di mana.

## Keluaran

Tulis `src/reels/specs/<id>.brief.md` (ringkas, satu bagian per butir di atas). Tampilkan ke manusia, lalu **berhenti dan tunggu `APPROVE BRIEF`**. Catat satu baris di `out/<id>/approvals.md`. Tidak ada skor, segel, atau skrip approve.
