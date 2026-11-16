# Reel03: Mora Jaya showcase

18.4 s, 1080x1920, 30 fps, real 3D (three.js through `@remotion/three`). Brief: `data/reels/20261115-morajaya-showcase/brief.md` (approved 2026-11-15, 62/100).

## Render

```
npx remotion studio                                   # preview, composition "Reel03"
npx remotion render src/index.ts Reel03 out/reel03.mp4
npx remotion still src/index.ts Reel03 out/x.png --frame=120 --scale=0.4
```

Headless Chrome needs a software GL backend: `remotion.config.ts` sets `setChromiumOpenGlRenderer("angle")`.

## Where things live (there is no single `config.ts`)

| To change | File |
|---|---|
| Timings, scene order, backgrounds, which screenshot is on the glass, taps, floating cards, SFX cues | `timeline.ts` (everything is in beats of 140 BPM: `B(5.5)`) |
| Phone poses per scene, headline copy and colours, logo scene, Follow button | `Scene3D.tsx` (`POSES`, `SceneText`, `HookText`) |
| Flat background colours, the end card (niskalaworks.dev) | `Reel03.tsx` (`BG`, `EndCard`) |
| 3D words | `textShapes.json`, baked from Archivo (width 125) by `scripts/reel03/bake_text.py` + `bake_text.mjs`. A new word must be added to the list in `bake_text.mjs`, baked, and added to `WordKey` in `geo.ts` |
| Screens | `public/reels/reel03/screens/*.png` (customer names and numbers are blurred; keep the unblurred originals out of the repo) |
| Music and SFX | `scripts/audio/reel03_audio.py` writes `public/reels/reel03/audio/*.wav`. Beat numbers at the top of the file mirror `timeline.ts`: change both |

Audio: `/tmp/.../venv/bin/python scripts/audio/reel03_audio.py` needs numpy and scipy.

## Rules that apply

- Any change to `brief.md` revokes the approval; re-approve (name + APPROVE, then `npm run approve-brief`).
- Headline copy is feature names only, no result claims. Dashboard numbers are test data and must not be emphasised.
- Hook: at most about 3 full flashes per second.
