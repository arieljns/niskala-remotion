# AGENTS.md

Repo ini adalah proyek Remotion untuk Reels Niskala Works (`niskalaworks.dev`).
**Aturan di file ini mengikat semua LLM/agent** (Claude Code, Codex, Cursor, Gemini, dll.) dan semua anggota tim. Tidak ada pengecualian, tidak ada flag untuk melewatinya.

## ATURAN NOMOR 0: GRILL DULU

Sebelum menulis script, kode, aset, atau merender **reel apa pun** (ide baru, revisi besar, ganti angle):

1. Jalankan wawancara **`grill-reel`**.
   - Claude Code: pakai skill `grill-reel`.
   - Agent lain: baca `.claude/skills/grill-reel/SKILL.md` dan ikuti isinya persis seperti instruksi sistem.
2. Hasilnya `brief.md` (struktur: `docs/templates/brief.md`) di folder reel, disetujui manusia dengan mengetik **nama + `APPROVE`**. "ok", "lanjut", "terserah" bukan persetujuan.
3. **Tanpa brief approved, jangan kerjakan apa pun untuk reel itu.** Kalau user minta langsung bikin/ubah reel, tolak dengan sopan dan mulai wawancara.
4. Kalau ada yang salah setelah render/posting: masuk **mode debrief** (lihat SKILL.md), jangan langsung ubah kode.

Pengecualian hanya untuk pekerjaan infrastruktur yang tidak menyangkut satu reel tertentu (membangun pipeline, token, komponen library, docs), dan itu tetap mengikuti fase di `docs/reels-workflow/STATUS.md`.

## Wajib dibaca sebelum mengerjakan apa pun

1. `docs/reels-workflow/AGENT_GUIDE.md`: cara kerja, aturan ringkas, checklist
2. `docs/reels-workflow/GRILL_GATE.md`: spesifikasi gerbang grill + brief
3. `docs/reels-workflow/BRIEF.md`: spesifikasi sistem produksi (sumber kebenaran)
4. `docs/reels-workflow/STATUS.md`: fase aktif, keputusan, TODO terbuka
5. `docs/reels-workflow/CONFLICTS.md`: konflik repo vs brief yang belum diputuskan

Kerjakan hanya fase yang aktif di STATUS.md, dan update STATUS.md setiap kali menyelesaikan fase atau mengambil keputusan.
