# Konflik: Repo vs Brief

Hal-hal di repo saat ini (2026-11-10) yang bertentangan dengan `BRIEF.md`. Agent **tidak boleh** menyelesaikannya diam-diam:
ajukan opsi ke pemilik di Fase 0, lalu catat keputusannya di `STATUS.md`.

| # | Brief bilang | Repo sekarang | Lokasi |
|---|---|---|---|
| 2 | Archivo (heading) + Lexend (body) untuk semua teks | UI klien di dalam layar perangkat (toko demo, layar iOS) memakai **Manrope** (+ Inter untuk chat) dan palet klien | `src/theme/fonts.ts`, `src/theme/client.ts`, `src/reels/ui/ios/` |
| 3 | Struktur `src/tokens/`, `components/{ui,mockups,motion}`, `scenes/`, `templates/`, `gallery/` | Kode ada di `src/reels/` (primitif + `reel01/` + `ui/ios/`) dan `src/theme/` (senja, client, motion, fonts) | seluruh `src/` |
| 4 | Data reel di `data/reels/<YYYYMMDD-slug>/` dari `timeline.json` | Reel 01 memakai `timeline.ts` + `copy.ts` hardcode di kode | `src/reels/reel01/` |
| 5 | Root folder `reels/` | Repo root sendiri adalah proyek Remotion | root repo |

Catatan untuk #2: font lapisan Niskala sudah diputuskan (Archivo heading + Lexend body, lihat STATUS.md). Yang masih terbuka: apakah UI fiktif di dalam layar perangkat boleh tetap pakai Manrope/Inter supaya terlihat seperti aplikasi asli, atau ikut Archivo/Lexend.

Kalau konflik sudah diputuskan, pindahkan barisnya ke bagian "Keputusan" di `STATUS.md` dan hapus dari tabel ini.
