# Brief — Niskala Reels Standardized Workflow

> Dokumen ini adalah **sumber kebenaran** untuk sistem produksi Reels Niskala.
> Disalin apa adanya dari brief pemilik repo (2026-11-10). Jangan diubah tanpa persetujuan pemilik.
> Agent: baca `AGENT_GUIDE.md` dulu, lalu dokumen ini.
> Semua nilai bertanda `TODO` harus diisi/dikonfirmasi pemilik, jangan diisi dengan tebakan.

---

## ROLE

Kamu adalah engineer + motion designer yang membangun **sistem produksi Reels yang terstandardisasi** untuk Niskala (web agency Indonesia, jualan situs "margin-recovery" ke seller toko online). Tim produksi Reels akan memakai sistem ini, jadi prioritasnya: **konsisten, bisa dipakai ulang, bisa dipakai orang selain pemilik repo, dan nol token per render.**

Stack: Remotion (sudah ada di codebase), Node, Python, ffmpeg, Linux. Render lokal, tanpa API berbayar saat produksi rutin.

## TUJUAN

Workflow **voice-over-first**:

```
Script (beat sheet) → Voice over (audio) → Transkrip word-level timestamp → timeline.json → Remotion render → QA → Export → Log
```

Satu reel baru = satu folder data + satu perintah render. Tim tidak perlu menyentuh kode React untuk membuat reel dari template yang sudah ada.

## ATURAN KERAS (tidak boleh dilanggar)

**Brand**
- Font: **Archivo untuk heading/display, Lexend untuk body** (sub-line, eyebrow, teks kecil). *(Direvisi pemilik 2026-11-10, sebelumnya: "Archivo untuk semua teks".)*
- Palet: **Senja**. Ambil nilai warna dari token/brand file yang sudah ada di repo. Kalau tidak ketemu, tulis `TODO` dan tanyakan, jangan mengarang hex.
- Handle IG & domain: `niskalaworks.dev`.
- Format: 1080×1920, `TODO: 30 atau 60 fps` (default 30), safe area atas/bawah untuk UI Instagram (`TODO: konfirmasi px`, usulkan default lalu tandai).

**Konten**
- Alur narasi standar: **hook kontrarian → alasan konkret → solusi → CTA follow untuk tips**.
- Reels tugasnya menarik perhatian seller dan memicu mereka, bukan menyampaikan informasi lengkap.
- Dilarang menampilkan kutipan berita atau sumber di layar.

**Motion**
- Gaya: polished ala Apple, kinetic motion design (referensi gaya dnyxstudios).
- **Kamera pan ke setiap kata saat kata itu muncul** supaya konteks tidak hilang.
- Zoom hanya ke komponen yang punya tujuan jelas, **tidak pernah zoom ke kata tanpa konteks**.
- Momen chart/data harus **dilebih-lebihkan** (font raksasa, motion berlebihan), **tapi teks tidak boleh terpotong** dan konteks tidak boleh hilang. Gunakan `fitText`/`measureText` dari `@remotion/layout-utils` agar teks selalu muat.

## CARA KERJA KAMU

1. **Fase 0 dulu: audit & rencana. Berhenti dan tunggu persetujuan saya** sebelum lanjut.
   - Baca repo: struktur, komposisi Remotion yang sudah ada (termasuk reel "Kamu dapet…" slot-machine), token, font, audio.
   - Laporkan: apa yang bisa dipakai ulang, apa yang harus dibangun, apa yang konflik dengan aturan di atas, dan daftar `TODO` yang perlu saya isi.
2. Setelah disetujui, kerjakan Fase 1–6 berurutan. Di akhir tiap fase: jalankan verifikasinya, lalu laporkan singkat (apa yang dibuat, cara mengujinya, apa yang masih TODO). Jangan lanjut kalau verifikasi gagal.
3. Jangan membangun aset spekulatif. Bangun hanya aset di daftar "Starter Asset Set" di bawah. Aset baru ditambah lewat aturan di `docs/ADDING_ASSETS.md`.
4. Semua komponen harus menerima props, tanpa teks/warna/angka hardcode di dalam komponen.
5. Kalau ada keputusan desain yang ambigu, ajukan maksimal 3 opsi dengan rekomendasi, jangan menebak diam-diam.

## STRUKTUR FOLDER TARGET

```
reels/
├─ src/
│  ├─ tokens/            # warna Senja, Archivo, spacing, safe area, durasi/easing standar
│  ├─ components/
│  │  ├─ ui/             # komponen UI (lihat daftar)
│  │  ├─ mockups/        # frame perangkat
│  │  └─ motion/         # primitif animasi
│  ├─ scenes/            # gabungan komponen = 1 beat (HookScene, ReasonScene, dst.)
│  ├─ templates/         # komposisi utuh yang dibaca dari timeline.json
│  ├─ gallery/           # AssetGallery: preview semua aset di satu komposisi
│  └─ Root.tsx
├─ data/reels/<YYYYMMDD-slug>/
│  ├─ script.md          # beat sheet (sumber kebenaran)
│  ├─ vo.wav             # voice over final
│  ├─ transcript.json    # word-level timestamp
│  ├─ timeline.json      # hasil gabungan beat + timing
│  └─ meta.json          # template, tema, caption, hashtag, status
├─ public/{vo,sfx,music}/
├─ scripts/              # transcribe, build-timeline, render, qa, log
├─ out/                  # hasil render (gitignored)
└─ docs/                 # SOP tim
```

## FASE 1 — TOKENS & FONDASI

- `tokens/`: warna Senja (dari repo, sisanya `TODO`), Archivo + Lexend (weights yang dipakai), skala tipografi untuk 1080×1920, spacing, safe area, durasi & easing standar (satu set easing "Apple-like" yang dipakai semua animasi).
- **Tema warna**: minimal 3 tema (`senja` default + `TODO: 2 tema lain`) yang bisa di-switch dari `meta.json` tanpa ubah kode.
- Verifikasi: komposisi `TokensPreview` menampilkan semua token.

## FASE 2 — STARTER ASSET SET

Bangun semua ini sebagai komponen berprops, masing-masing punya contoh di `AssetGallery`.

**A. Primitif animasi (`components/motion/`)**
1. `KineticWords`: teks muncul kata per kata, sinkron ke timestamp, dengan **kamera pan ke kata aktif**; teks auto-fit.
2. `CameraRig`: pembungkus pan/zoom yang menerima target (kata atau komponen) dan menegakkan aturan "zoom hanya ke komponen bertujuan".
3. `NumberCounter`: angka naik/turun dengan mode "exaggerated" (font raksasa, overshoot).
4. `SlotRoll`: mekanik slot-machine dari reel "Kamu dapet…" yang dirapikan jadi komponen.
5. `Reveal`/`Wipe`/`PushTransition`: set transisi antar-scene (maks 4 jenis, konsisten).
6. `EndCard`: CTA akhir (follow untuk tips + `niskalaworks.dev`).

**B. Mockup (`components/mockups/`)**
7. `PhoneFrame` (konten bisa berupa komponen/gambar/video).
8. `LaptopFrame` / `BrowserFrame` (untuk menampilkan website/dashboard).

**C. Komponen UI (`components/ui/`)**
9. `NotificationCard`: notifikasi pesanan/marketplace.
10. `ChatBubble` + `ChatThread`: percakapan pembeli–penjual.
11. `FeeBreakdownCard`: rincian potongan marketplace dengan angka animasi.
12. `DashboardCard` + `BarChart`/`LineChart` sederhana versi exaggerated.
13. `OrderListRow`: baris pesanan untuk dashboard.
14. `CTAButton` dan `UrlPill` (`niskalaworks.dev`).
15. `Sticker/Badge`: label kecil untuk emphasis ("Rp…", "−%", "repeat order").

Semua data di komponen UI adalah **dummy yang jelas fiktif** (tidak memakai merek/toko asli).

- Verifikasi: `AssetGallery` render tanpa error, tidak ada teks terpotong di safe area, semua komponen bisa diganti tema.

## FASE 3 — PIPELINE VOICE-OVER-FIRST

Bangun scripts berikut (Node/Python, jalan lokal):

1. `scripts/transcribe.py`: `vo.wav` → `transcript.json` (word-level timestamps, bahasa Indonesia). Gunakan faster-whisper atau whisper.cpp yang jalan lokal di Linux; pilih yang paling stabil dan jelaskan alasannya. Pastikan terjemah kata benar untuk campuran Indonesia–Inggris (istilah seperti "marketplace", "repeat order").
2. `scripts/build-timeline.ts`: gabungkan `script.md` (beat sheet) + `transcript.json` → `timeline.json`. Tiap beat punya: id, jenis scene, teks, `startFrame`, `endFrame`, daftar kata dengan frame-nya, aset yang dipakai, props.
3. `scripts/render.ts`: baca satu folder reel atau banyak (`--all`, `--status ready`) lalu render ke `out/` dengan penamaan standar `YYYYMMDD_slug_template_tema.mp4`. Durasi komposisi dihitung dari `timeline.json` via `calculateMetadata`.
4. `scripts/qa.ts`: cek otomatis sebelum export:
   - teks keluar safe area / terpotong,
   - durasi di luar batas `TODO: mis. 15–45 dtk`,
   - font selain Archivo (heading) dan Lexend (body),
   - hook muncul setelah detik ke-`TODO: 1.5`,
   - audio clipping / loudness di luar target `TODO: mis. -14 LUFS`,
   - kata kunci terlarang (kutipan sumber berita) di `script.md`.
   Output: laporan pass/fail yang gampang dibaca anggota tim non-teknis.
5. `scripts/log.ts`: tambahkan baris ke `data/log.csv` (id, template, hook, tema, tanggal render). Kolom performa (retensi 3 detik, share, save, follow) diisi manual belakangan.
6. `scripts/new-reel.ts <slug>`: scaffold folder reel baru dari template `script.md` + `meta.json`.

**Format `script.md` (beat sheet)**, buat ini sederhana supaya tim bisa mengisi tanpa kode:

```
# <judul internal>
template: <nama template>
tema: <senja|...>

[HOOK]    Teks VO baris hook          | scene: kinetic
[ALASAN]  Teks VO alasan 1            | scene: ui-notification | data: ...
[ALASAN]  Teks VO alasan 2            | scene: fee-breakdown   | data: ...
[SOLUSI]  Teks VO solusi              | scene: browser-mockup  | data: ...
[CTA]     Teks VO penutup             | scene: endcard
```

- Verifikasi: jalankan pipeline end-to-end memakai VO sampel (`TODO: saya sediakan 1 file vo.wav uji; kalau belum ada, buat script uji yang menghasilkan audio dummy untuk tes timing`).

## FASE 4 — TEMPLATE

Buat 2 template dulu, keduanya membaca `timeline.json`:

1. **`SlotReveal`**: dari format "Kamu dapet…" (slot-machine), ditutup dengan: "Marketplace buat cari buyer baru. Website buat pelanggan yang repeat order." → `niskalaworks.dev`.
2. **`ContrarianExplainer`**: hook kontrarian → 2–3 alasan (komponen UI/mockup sesuai beat) → solusi → CTA follow.

Tiap template wajib: mendukung semua tema, lolos `qa.ts`, dan bisa dirender dari `script.md` baru tanpa mengubah kode.

## FASE 5 — SOP TIM (`docs/`)

Tulis dokumen singkat, bahasa Indonesia santai tapi jelas, siap dipakai orang baru:

- `README.md`: gambaran alur 1 halaman + setup lokal (Linux) + perintah inti.
- `WORKFLOW.md`: langkah per reel dari ide sampai posting, dengan **siapa mengerjakan apa**: Penulis script → Voice over → Operator render → QA → Posting & log. Peran bisa dirangkap; beri `TODO` untuk nama tim.
- `SCRIPT_GUIDE.md`: cara menulis hook, panjang kalimat VO per beat, dan contoh bagus vs buruk sesuai aturan konten di atas.
- `QA_CHECKLIST.md`: checklist manual yang melengkapi `qa.ts` (audio, kejelasan hook, brand, safe area di HP asli).
- `ADDING_ASSETS.md`: aturan menambah aset/template baru (kapan boleh, naming, wajib masuk Gallery, wajib berprops, wajib lolos QA).
- `NAMING.md`: konvensi nama file/folder/branch.

## FASE 6 — DEMO END-TO-END

Buat 1 reel contoh lengkap dari `new-reel.ts` sampai `out/*.mp4` memakai template `ContrarianExplainer`, dan 1 lagi memakai `SlotReveal`. Tunjukkan perintah persis yang dijalankan dan laporan `qa.ts`.

## DEFINITION OF DONE

- Anggota tim baru bisa membuat reel dari nol hanya dengan membaca `docs/` + mengisi `script.md` + menaruh `vo.wav`.
- Satu perintah menghasilkan video terender dan laporan QA.
- Tidak ada warna/teks/angka hardcode di komponen.
- `AssetGallery` menampilkan semua aset dalam semua tema.
- Nol pemanggilan API berbayar saat render rutin.

## LAPORAN AKHIR

Tutup dengan: daftar file kunci yang dibuat, perintah inti (maks 6 baris), daftar `TODO` yang masih menunggu saya, dan 3 risiko terbesar sistem ini.

---

## TODO UNTUK PEMILIK (jangan diisi agent)

- [ ] TODO: fps final (30/60) dan safe area px
- [ ] TODO: nilai palet Senja jika belum ada di repo, plus 2 tema alternatif
- [ ] TODO: sumber voice over standar (suara sendiri / anggota tim / TTS) dan target loudness
- [ ] TODO: batas durasi reel (min–max)
- [ ] TODO: nama & peran anggota tim untuk `WORKFLOW.md`
- [ ] TODO: sample `vo.wav` untuk uji pipeline
