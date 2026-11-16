# Laporan akhir: workflow reel deterministik (Stage 0, A sampai J)

Tanggal: 2026-11-17. Seluruh pekerjaan lokal; tidak ada Docker, tidak ada CI.

## 1. Apa yang dibangun

Model hanya mengisi **spec copy**. Gaya, gerak, kamera, UI, aset, cutting, dan editing dikunci ke Reel01 oleh kode, dan semua model
(Claude, Gemini, GPT) melewati pintu yang sama.

| Stage | Hasil |
|---|---|
| 0 | Baseline Reel01 (MP4 + 33 still + hash) di `out/baseline/` |
| A | Kontrak Zod 4 tertutup (`src/reels/contract/`), spec golden Reel01, Reel01 dirender dari spec |
| B | Lint copy: karakter, frasa terlarang, angka vs brief, muat dan terbaca (diukur di Chromium) |
| C | `reel:check`: kontrak, lint, gerak, zona aman, anggaran gerak, pemindai API non-deterministik, gerbang brief |
| D | State machine dari bukti di disk, segel approval per berkas (7 grup), `reel:approve` hanya manusia |
| E | Manifest aset (sha256), VO prep (WAV 48 kHz, -16 LUFS), cue disarankan lalu dikonfirmasi manusia, timing dilepas ke sidecar |
| F | `reel:verify` dan `reel:render` (render resmi, toleransi perseptual terukur), font self-hosted, bundel Remotion dibersihkan sendiri |
| G | Penjaga lokal: `guard:lock/unlock/status/audit`, hook PreToolUse, `permissions.deny`, `DURATION_EXCEEDED`, `ENFORCEMENT.md` |
| H | Fixture untuk tiap kode galat, `test:cli` (percobaan melewati gerbang), `test:all` |
| I | Suite konformansi model: `conformance:init/check/score/compare` + `test:conformance` |

## 2. Alur per reel

`reel:grill` → isi spec → rekam VO → `reel:vo-prep` → `reel:cues` (manusia `--confirm`) → `reel:check` → `reel:stills` → manusia `reel:approve` →
`reel:render`. Status kapan saja: `npm run reel:status -- <id>`. Detail: `AGENTS.md`, `docs/reels-workflow/AGENT_GUIDE.md` bagian 0b.

## 3. Bukti (terakhir dijalankan 2026-11-17)

`npm run test:all` hijau (2 menit 38 detik): `test:guard`, `test:negative` (71 kasus, 30 kode, setiap kode aktif punya fixture),
`test:cli` (13 pemeriksaan percobaan melewati gerbang), `test:conformance` (4 model tiruan), `test:reel01-spec` (31 frasa sama persis dengan
kode asli di commit `a97b8b4`), `verify-gate`, dan baseline Reel01 (33 frame: 31 identik, 2 varian yang dikenal). `tsc` bersih untuk root dan
`scripts`. `eslint` masih menampilkan 2 error lama di `src/reels/reel03/Reel03.tsx` (bukan dari pekerjaan ini).
Render resmi terbukti ujung ke ujung pada konteks sementara: MP4 1080x1920, 30 fps, 16 frame yang di-approve identik.

## 4. Penyimpangan dari prompt awal (dan alasannya)

- Tidak ada Docker: pemilik memilih opsi A. Determinisme diganti **toleransi perseptual terukur** (`diff-limits.json`).
- Tone per segmen (`plain|quiet|strong|accent`) dan baris sebagai array, karena Reel01 memakainya.
- Skrip di `scripts/` (konvensi repo), bukan `tools/`. Tidak ada `assets.lock.json` terpisah: segel approval sudah mengunci hash aset.
- Aturan karakter dilonggarkan atas permintaan pemilik (emoji, karakter tak terlihat, aksara lain, `* _ ~` tetap ditolak).
- Tidak ada CI dan tidak ada push otomatis: workflow sepenuhnya lokal (keputusan pemilik).

## 5. Batas yang harus diketahui (jujur)

1. **Render tidak byte-identik.** Frame 925, 1156, 867 Reel01 tidak stabil karena balapan yang sensitif terhadap beban mesin. Yang dijaga
   adalah toleransi (PSNR >= 45 dB). Perubahan sangat kecil (satu koma) bisa lolos.
2. **Penjaga adalah penghalang kecelakaan, bukan keamanan.** Pemilik bisa `chmod` balik; agent dengan shell bisa menulis lewat interpreter;
   hook hanya berlaku di Claude Code (agent lain bergantung pada `AGENTS.md` dan kunci read-only). Instruksi tidak bisa mencegah model
   *mengatakan* ia akan membuat visual lain: yang bisa dicegah hanya hasilnya.
3. **Segel `APPROVED` lokal** (`out/` di `.gitignore`) dan bukan bukti kriptografis; ia mengikat hash berkas, bukan identitas.
4. **Cek di browser hanya mengukur tiap frasa sendirian** (bukan konteks adegan), dan timing kata masih terkunci ke jumlah kata VO Reel01
   sampai reel punya rekaman sendiri.
5. **Saran cue adalah heuristik panjang huruf, bukan pengenalan suara** (rata-rata galat kata 0,23 s). Manusia wajib mendengarkan.
6. **Belum terbukti dengan model sungguhan secara lengkap.** Alat uji siap dan teruji dengan model tiruan. Satu percobaan Gemini
   menunjukkan ia sempat menyatakan akan membuat visual berbeda; aturan `AGENTS.md` sudah diperketat sesudahnya, tetapi belum diuji ulang.
   Uji lanjutan: `docs/ENFORCEMENT.md` bagian 5 (dua putaran per model: terbuka dan terkunci).

## 6. TODO pemilik yang masih terbuka

- [ ] Lisensi enam gambar produk Reel01 (`TODO` di manifest) dan verifikasi atribusi font (Archivo, Lexend, Manrope, Inter: SIL OFL).
- [ ] Setujui `src/reels/contract/forbidden.json` (usulan agent, aktif tapi belum disetujui).
- [ ] Keputusan lantai skala hook: 1.0 (usulan) atau tetap seketat Reel01 (hook Reel01 selebar 859 dari 860 px).
- [ ] `TODO_REMOTION_LICENSE` (lisensi Remotion untuk penggunaan komersial).
- [ ] Coba manual di terminalmu: `reel:approve demo-variasi` dan `reel:cues --confirm` (tidak bisa dijalankan dari sesi agent).
- [ ] Jalankan uji konformansi dengan Gemini/GPT/Claude (dua putaran), lalu kunci repo dengan `npm run guard:lock` sebelum diserahkan ke agent pembuat reel.
- [ ] Rekam VO untuk reel baru pertama (14 scene) supaya `reel:cues` dan jumlah kata bebas dari timing Reel01.
- [ ] Nama dan peran anggota tim untuk `WORKFLOW.md`, dan keputusan tiap konflik di `CONFLICTS.md` (TODO lama).
