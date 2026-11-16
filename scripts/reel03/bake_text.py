"""
Reel03's 3D words are extruded outlines of Archivo at width 125. This pins the
variable font to wdth 125 (wght 500 and 700) into scripts/reel03/.cache/, then
bake_text.mjs turns the words into src/reels/reel03/textShapes.json.

    python scripts/reel03/bake_text.py && node scripts/reel03/bake_text.mjs
    (needs fonttools + brotli for python, opentype.js for node)
"""
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / ".cache"
OUT.mkdir(exist_ok=True)
for weight in (500, 700):
    font = TTFont(ROOT / "public/fonts/archivo-variable-wdth-wght-latin.woff2")
    instantiateVariableFont(font, {"wdth": 125, "wght": weight}, inplace=True)
    font.flavor = None
    if "GSUB" in font:
        del font["GSUB"]  # opentype.js cannot read this font's contextual lookups; the words need none
    font.save(OUT / f"archivo125-{weight}.ttf")
print("ok")
