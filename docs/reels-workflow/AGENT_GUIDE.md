# Agent Guide — Niskala Reels Workflow

Panduan untuk agent AI (Claude Code, Codex, Cursor, dll.) dan anggota tim yang mengerjakan Reels di repo ini.
Tujuannya satu: **apa pun yang dikerjakan, hasilnya konsisten dengan standar yang sama.**

## 1. Urutan baca (wajib, sebelum menyentuh kode)

1. `docs/reels-workflow/AGENT_GUIDE.md`: file ini (cara kerja + aturan ringkas).
2. `docs/reels-workflow/BRIEF.md`: spesifikasi lengkap, sumber kebenaran.
3. `docs/reels-workflow/STATUS.md`: fase mana yang sudah selesai, keputusan apa yang sudah diambil, TODO apa yang masih terbuka.
4. `docs/reels-workflow/CONFLICTS.md`: bagian repo yang masih bertentangan dengan brief. Jangan "membereskan" konflik ini diam-diam.

Kalau ada yang bertentangan: **BRIEF.md > keputusan tercatat di STATUS.md > kode yang ada**. Kalau brief dan keputusan pemilik di STATUS.md berbeda, ikuti STATUS.md (keputusan itu lebih baru).

## 2. Aturan kerja agent

1. **Cek STATUS.md dulu.** Kerjakan hanya fase yang statusnya `next` atau `in-progress`. Jangan loncat fase.
2. **Fase 0 (audit) wajib berhenti** dan menunggu persetujuan pemilik sebelum Fase 1.
3. **Akhir tiap fase:** jalankan verifikasinya (lihat BRIEF.md), laporkan singkat (apa yang dibuat, cara menguji, TODO tersisa), lalu update STATUS.md. Verifikasi gagal = jangan lanjut.
4. **Jangan isi TODO pemilik dengan tebakan.** Boleh usulkan default, tapi tandai `TODO(usulan)` dan tanyakan.
5. **Keputusan ambigu:** ajukan maksimal 3 opsi + rekomendasi. Jangan memutuskan diam-diam.
6. **Tidak ada aset spekulatif.** Bangun hanya yang ada di "Starter Asset Set". Aset baru lewat `docs/ADDING_ASSETS.md` (dibuat di Fase 5).
7. **Semua komponen berprops.** Tidak boleh ada teks, warna, atau angka hardcode di dalam komponen; semua lewat props atau tokens.
8. **Nol API berbayar saat render rutin.** Transkripsi dan render jalan lokal.
9. **Catat keputusan baru** di STATUS.md bagian "Keputusan", lengkap dengan tanggal, supaya agent berikutnya tidak menanyakan ulang.

## 3. Aturan keras (ringkas, detail di BRIEF.md)

**Brand**
- Font Archivo (lihat CONFLICTS.md soal Lexend/Manrope yang masih ada di repo).
- Palet Senja, nilainya diambil dari token di repo. Jangan mengarang hex.
- Handle & domain: `niskalaworks.dev`.
- 1080×1920, fps dan safe area: lihat STATUS.md (masih TODO sampai pemilik isi).

**Konten**
- Alur: hook kontrarian → alasan konkret → solusi → CTA follow untuk tips.
- Tujuannya memancing seller, bukan menjelaskan semuanya.
- Dilarang menampilkan kutipan berita/sumber di layar.
- Data dummy harus jelas fiktif (tanpa merek/toko asli).

**Motion**
- Polished ala Apple, kinetic (referensi dnyxstudios).
- Kamera pan ke tiap kata saat kata muncul.
- Zoom hanya ke komponen yang punya tujuan, tidak pernah ke kata tanpa konteks.
- Momen data dilebih-lebihkan, tapi teks tidak boleh terpotong. Pakai `fitText`/`measureText` dari `@remotion/layout-utils`.

## 4. Alur produksi satu reel (target setelah Fase 6)

```
script.md → vo.wav → transcribe → transcript.json → build-timeline → timeline.json → render → qa → log
```

Satu reel = satu folder `data/reels/<YYYYMMDD-slug>/` + satu perintah render.
Perintah persisnya ditulis di `docs/README.md` setelah Fase 5 selesai. Sampai saat itu, jangan berimprovisasi dengan pipeline sendiri.

## 5. Checklist sebelum menyerahkan pekerjaan

- [ ] Hanya mengerjakan fase yang aktif di STATUS.md
- [ ] Verifikasi fase sudah dijalankan dan lolos (sertakan output-nya)
- [ ] Tidak ada hardcode teks/warna/angka di komponen
- [ ] Tidak ada font/warna di luar aturan brand (atau sudah dicatat di CONFLICTS.md)
- [ ] Teks tidak terpotong dan tetap di dalam safe area
- [ ] Tidak ada kutipan berita/sumber, tidak ada merek asli
- [ ] STATUS.md sudah diupdate (fase, keputusan, TODO)
