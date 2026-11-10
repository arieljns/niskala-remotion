---
id: fixture
brief_status: draft        # draft | approved
approved_by:
approved_at:
llm_reviewer:
confidence:
---

# Brief: Marketplace bukan rumah (uji gate)

> Fixture untuk `npm run verify-gate`. Semua angka dan nama fiktif. Jangan dipakai sebagai reel sungguhan.

## 1. Tujuan & audiens
- Audiens spesifik: Seller tumbler di marketplace, omzet ±30 jt/bln, margin tergerus biaya admin + promo (fiktif, uji)
- Satu aksi/pikiran yang diinginkan setelah menonton: "Pelanggan lamaku harusnya belanja ulang di tempatku sendiri"
- Hipotesis yang diuji: Hook yang membalik "laris = untung" menaikkan retensi 3 detik
- Metrik sukses + ambang: Retensi 3 detik ≥ 45%, save ≥ 2% dari view

## 2. Hook & klaim
- Hook final: Makin laris di marketplace, makin tipis untungmu.
- Keyakinan seller yang dibantah: Semakin banyak order di marketplace, semakin untung
- Bukti/basis klaim (internal, tidak tampil di layar): Simulasi rincian potongan admin + promo + ongkir subsidi (angka fiktif, uji)
- Kapan hook ini salah: Seller dengan margin produk sangat tinggi atau yang tidak ikut program promo
- 2 hook alternatif yang ditolak + alasan: "Marketplace itu jebakan" (menyerang, tidak bisa dibuktikan); "Cek potonganmu" (tidak memicu)

## 3. Storyline
| Beat | Isi | Alasan ada di urutan ini | Bukti visual |
|------|-----|--------------------------|--------------|
| HOOK | Makin laris, makin tipis untung | Membalik keyakinan di detik pertama | KineticWords |
| ALASAN 1 | Tiap order dipotong admin + promo | Paling konkret, langsung terasa | FeeBreakdownCard |
| ALASAN 2 | Pembeli ulang tetap kena potongan yang sama | Menghubungkan ke repeat order | NotificationCard berulang |
| SOLUSI | Pelanggan ulang belanja di website sendiri | Jawaban langsung dari alasan 2 | BrowserFrame |
| CTA | Follow untuk tips margin | Satu aksi ringan untuk orang asing | EndCard |
- Keberatan seller yang dijawab: "Tanpa marketplace aku nggak dapat pembeli" → marketplace tetap untuk pembeli baru
- Informasi yang sengaja ditahan: Cara membangun website, harga paket

## 4. CTA & kesesuaian penawaran
- CTA tunggal: Follow untuk tips margin
- Janji yang dibuat dan basisnya: Tidak ada janji angka hasil; hanya mengajak mengecek potongan sendiri

## 5. Rencana visual
| Beat | Aset | Alasan memakai aset ini | Catatan kamera |
|------|------|-------------------------|----------------|
| HOOK | KineticWords | Kalimat hook harus terbaca kata per kata | Pan ke tiap kata |
| ALASAN 1 | FeeBreakdownCard | Menunjukkan potongan sebagai angka | Zoom ke baris total potongan |
- Momen exaggerated + cara mencegah teks terpotong: Total potongan font raksasa, ukuran dihitung fitText
- Aset baru dibutuhkan? (ya/tidak + alasan): Tidak, semua ada di Starter Asset Set

## 6. Produksi
- Pengisi VO: Pembuat sendiri
- Target durasi: 30 detik
- Template & tema: ContrarianExplainer, senja

## 7. Kalau ada yang salah
| Gejala | Asumsi di brief yang mungkin keliru | Yang dicek/diubah dulu |
|--------|-------------------------------------|------------------------|
| Retensi 3 detik < 45% | Hook kurang memicu | Ganti hook dengan alternatif lain |
| Banyak komentar "nggak juga" | Kasus margin tinggi diabaikan | Tambah kualifikasi di alasan 1 |
| Save tinggi, follow nol | CTA terlalu lemah | Uji CTA yang menjanjikan seri tips |

## 8. Teach-back
- Ringkasan versi pembuat (tanpa melihat brief): Seller marketplace dengan margin tipis; klaim: laris belum tentu untung karena potongan; urutan potongan → pelanggan ulang → website; kalau gagal ganti hook
- Hasil penilaian pewawancara (lolos / perlu diulang di tahap X): Lolos

## 9. Persetujuan
Dua-duanya wajib. Batas confidence ada di `config/brief-gate.json` (sementara rendah: keseluruhan ≥ 50, tiap tahap ≥ 30).

### Pembuat
- Nama: Penguji Gate
- Ketik: APPROVE
- Tanggal: 2026-11-10

### Reviewer LLM
- Model: claude-opus-5-5
- Confidence Tujuan: 85
- Confidence Hook: 82
- Confidence Storyline: 88
- Confidence CTA: 90
- Confidence Visual: 80
- Confidence Produksi: 92
- Confidence Teach-back: 85
- Confidence keseluruhan: 86
- Alasan skor: Hook terbukti lewat simulasi potongan; visual tahap 5 baru dua beat
- Ketik: APPROVE
- Tanggal: 2026-11-10
