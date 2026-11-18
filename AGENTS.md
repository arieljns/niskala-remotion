# AGENTS.md

Repo ini adalah proyek Remotion untuk Reels Niskala Works (`niskalaworks.dev`). Video dibuat dari kode.
Aturan di file ini mengikat semua LLM/agent (Claude Code, Codex, Cursor, Gemini, dll.) dan semua anggota tim.

Workflow v4 (human-in-the-loop) **menggantikan** workflow lama (Mode Terkunci/Terbuka, `reel:*` bergerbang, spec-only).
Satu reel berjalan lewat fase tetap. Manusia meng-approve tiap gerbang. Agent tidak pernah approve untuk manusia.

Reel **wajib di bawah 1 menit**.

## 0. Aturan sesi

- Di awal setiap chat, panggil skill `caveman`. Tetap aktif sampai sesi selesai.
  Cakupannya **hanya chat agent ke manusia**. Isi artefak (brief, copy, script VO, teks sheet, teks di layar) ditulis normal dan bersih.
- Gerbang terbuka **hanya** kalau pesan manusia berisi `APPROVE <GATE>` (`BRIEF`, `COPY`, `VO`, `SHEET`). "ok", "lanjut", "terserah", atau diam = belum approve. Berhenti dan tunggu di tiap gerbang.
- Catat tiap approve satu baris di `out/<id>/approvals.md` (gate, versi, waktu). Catat tiap fase satu baris `fase | mulai | selesai` di `out/<id>/timelog.md`.
- Grill = **satu pertanyaan per giliran**. Beri jawaban yang kamu sarankan, bantah kalau jawaban manusia kabur. Jangan mengisi jawaban sendiri.
- Nilai yang belum diketahui = `TODO_*` yang kelihatan. Jangan mengarang angka. Angka di layar harus ada di brief yang disetujui, berlabel `Contoh` atau bersumber.
- Aturan copy: Bahasa Indonesia, register "kamu", kalimat pendek, satu kata aksen per kalimat, tanpa emoji. Jangan pernah "pindah/tinggalkan marketplace" (pakai "numpang di platform orang", jangan "nyewa lapak"). Tanpa kutipan berita atau baris sumber di layar.
- Aset: boleh membuat aset/komponen baru dan boleh menyimpang dari token desain, **dengan syarat** ditandai `NEW` / `DEVIASI` di sheet, dengan alasan satu baris dan tipe (`eksperimen` | `lainnya`). Tanpa alasan = tidak boleh. Manusia yang menilai cocok atau tidaknya dengan reel sebelumnya.
- Kode seminimal mungkin: pakai komponen, token, dan primitif yang sudah ada sebelum menulis yang baru.

## 1. BRIEF

Grill berurutan, satu pertanyaan per giliran:
1. **Tujuan** reel (follow / kredibilitas / DM / klik web) dan apa yang harus dilakukan penonton setelahnya.
2. **Postingan**: ide inti, untuk siapa (seller toko online), masalah spesifik, kenapa sekarang.
3. **Tipe konten**: format/preset, fase funnel (TOFU/MOFU/BOFU), kelas `harian` (ringan) atau `flagship` (berat).
4. **Tujuan konten**: satu metrik utama (share | save | follow | DM) dan alasannya.

Lalu tanyakan: angka yang boleh muncul di layar (`Contoh`/sumber), aset/UI yang dibutuhkan, dan beda dari reel sebelumnya di mana.
Tulis `src/reels/specs/<id>.brief.md`. **Berhenti, tunggu `APPROVE BRIEF`.**

## 2. COPY

1. Tulis 2–3 varian hook dan copy per scene.
2. Petakan tiap hook ke **satu rumus hook** dari skill `ig-reel` dan centang konvensinya. Tidak cocok rumus mana pun = tulis ulang.
3. Panggil **subagent reviewer di konteks baru** dengan prompt `REVIEWER.md`. Kirim hanya: brief yang disetujui + hook + copy. Jangan kirim penalaranmu, draf lama, atau skor lama.
   Kalau agent tidak bisa spawn subagent, minta manusia membuka sesi baru dan menempel `REVIEWER.md` + ketiga berkas.
4. Skor di bawah `TODO_THRESHOLD` → revisi, lalu reviewer **sesi baru**. Maksimal 2 putaran, setelah itu manusia yang memutuskan.
5. Tampilkan: copy, pemetaan rumus, skor, perbaikan teratas. Skor hanya saran. **Berhenti, tunggu `APPROVE COPY`.**

## 3. VO

1. Tulis `out/<id>/vo.md`: tabel dengan `id` (V1…), scene, teks lisan, **arahan emosi** konkret (mis. "kesal tertahan", bukan "natural"), tempo, jeda.
2. Generate audio per baris (`TODO_TTS`, kosakata emosi `TODO_EMOTION_VOCAB`). Normalisasi dengan `npm run reel:vo-prep -- <id>`.
3. Manusia merevisi per `id`. Generate ulang **hanya** baris yang berubah.
4. `APPROVE VO` mencakup script **dan** audio. **Berhenti sampai itu.**
5. Sync: baris VO jadi penanda, visual mengikuti dengan toleransi (`TODO_VO_SYNC`). Jangan kunci visual ke cue per frame kecuali brief menyatakannya.

## 4. SHEET

1. Buat `out/<id>/sheet.md` + `contact.png`: storyline bernomor S1…Sn. Per scene: satu baris kejadian, `id` VO, teks layar, visual (komponen/aset), still, tanda `NEW` / `DEVIASI (alasan)` / `WARN`.
2. Tambah strip referensi dari reel sebelumnya. Untuk tiap scene `NEW`/`DEVIASI`, tulis klaim "sama / beda dari reel sebelumnya?" untuk dikonfirmasi manusia.
3. Revisi datang sebagai `REV S3: …`. Ubah **hanya** scene bernomor itu, tandai still-nya `REV<n>`, tulis scene lain "tidak berubah". Kalau perubahan memaksa scene lain ikut berubah, tanya dulu.
4. Ulangi sampai `APPROVE SHEET`. Tiap versi sheet yang direvisi = satu versi yang perlu di-approve.

## 5. VIDEO

1. Render dengan `npm run reel:render4 -- <id> [composition]` (composition default = id, mis. `Reel03`). Satu-satunya syarat: `out/<id>/approvals.md` punya baris `SHEET`. Jangan panggil `remotion render` langsung. `reel:render` lama (segel hash, pipeline spec) hanya untuk reel berbasis spec dan tidak wajib.
2. Scene yang tidak bisa dibangun seperti di sheet: **berhenti dan laporkan nomor scene-nya**. Jangan diganti diam-diam.
3. Laporkan waktu render dan nomor scene yang menyimpang dari sheet.

## 6. LOG

Tunggu `VERDICT sama` | `VERDICT beda-sengaja: <alasan>` | `VERDICT ulang S#`. Lalu tambah satu baris Konten Log: id, format, kelas, rumus hook, skor reviewer, emosi VO, flag deviasi, waktu per fase. Metrik (retention, share, save, follow, DM) diisi manusia kemudian.

## 7. Dilarang

- Meng-approve gerbang, melewati gerbang, atau mengedit riwayat `approvals.md` / `timelog.md`.
- Menyentuh scene yang tidak dinomori manusia dalam revisi.
- Memakai gaya caveman di dalam copy, script VO, atau teks sheet.
- Menjalankan `git push` (hanya manusia).
- Reel di atas 1 menit, atau angka di layar tanpa label `Contoh`/sumber.
- Mengubah file tanpa tahu apa yang bergantung padanya. Cek pemanggilnya dulu.

## Rujukan

`docs/WORKFLOW.md` dan `docs/reels-workflow/STATUS.md` (fase aktif, keputusan). Dokumen lama di `docs/` yang bertentangan dengan file ini dianggap usang. Kalau konflik, file ini menang.
