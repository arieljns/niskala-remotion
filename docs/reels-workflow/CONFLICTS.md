# Konflik: Repo vs Brief

Hal-hal di repo saat ini (2026-11-10) yang bertentangan dengan `BRIEF.md`. Agent **tidak boleh** menyelesaikannya diam-diam:
ajukan opsi ke pemilik di Fase 0, lalu catat keputusannya di `STATUS.md`.

| # | Brief bilang | Repo sekarang | Lokasi |
|---|---|---|---|
| 1 | Font **Archivo saja**, semua teks tanpa pengecualian | Sistem Senja memakai Archivo (wdth 125) untuk display **+ Lexend** untuk sub-line/eyebrow | `src/theme/fonts.ts` |
| 2 | Archivo untuk semua teks | UI klien di dalam layar perangkat (toko demo "Toko Anda") memakai **Manrope** (+ Inter untuk chat) dan palet lama cream/ink/sienna | komponen di `src/story/`, `src/components/mocks/` |
| 3 | Struktur `src/tokens/`, `components/{ui,mockups,motion}`, `scenes/`, `templates/`, `gallery/` | Kode tersebar: `src/tokens.ts`, `src/theme/`, `src/reels/`, `src/story/`, `src/components/`, `src/scenes/` | seluruh `src/` |
| 4 | Data reel di `data/reels/<YYYYMMDD-slug>/` dari `timeline.json` | Reel 01 memakai `timeline.ts` + `copy.ts` hardcode di kode | `src/reels/reel01/` |
| 5 | Root folder `reels/` | Repo root sendiri adalah proyek Remotion | root repo |

Catatan untuk #1 dan #2: aturan brand yang berlaku di repo sejauh ini adalah "token Senja hanya di luar layar perangkat, token klien hanya di dalam layar perangkat". Tanyakan ke pemilik apakah aturan "Archivo saja" di brief menggantikan aturan itu, atau hanya berlaku untuk lapisan Niskala.

Kalau konflik sudah diputuskan, pindahkan barisnya ke bagian "Keputusan" di `STATUS.md` dan hapus dari tabel ini.
