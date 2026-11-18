# Workflow Reel v4

Sumber aturan: `AGENTS.md`. File ini ringkasannya.

```
BRIEF --APPROVE BRIEF--> COPY + review independen --APPROVE COPY--> VO (emosi)
--APPROVE VO--> SHEET bernomor <-> REV S# --APPROVE SHEET--> VIDEO --> VERDICT + LOG
```

| Gerbang | Artefak | Siapa approve |
|---|---|---|
| BRIEF | `src/reels/specs/<id>.brief.md` | manusia |
| COPY | hook + copy + skor reviewer (`REVIEWER.md`) | manusia |
| VO | `out/<id>/vo.md` + audio | manusia |
| SHEET | `out/<id>/sheet.md` + `contact.png` | manusia |

- Approve = pesan manusia berisi `APPROVE <GATE>`. Dicatat di `out/<id>/approvals.md`; waktu fase di `out/<id>/timelog.md`.
- Revisi sheet: `REV S3: ...`, hanya scene itu yang berubah.
- Render: `npm run reel:render4 -- <id> [composition]` (butuh baris `SHEET` di approvals.md).
- Setelah render: `VERDICT sama` | `VERDICT beda-sengaja: <alasan>` | `VERDICT ulang S#`.
- Aset baru / deviasi token boleh, ditandai `NEW` / `DEVIASI` dengan alasan.
- Penjaga: `npm run guard:status | guard:lock | guard:audit`. Membuka kunci hanya manusia.
