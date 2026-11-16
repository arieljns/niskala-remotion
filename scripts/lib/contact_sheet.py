"""Builds out/<id>/contact.png from the stills listed in a JSON file.

usage: python3 -I contact_sheet.py <frames.json> <stills_dir> <out.png>
frames.json: [{"file": "frame-0000.png", "label": "start 0"}, ...]
"""
import json
import sys

from PIL import Image, ImageDraw

frames_path, stills_dir, out_path = sys.argv[1:4]
frames = json.load(open(frames_path, encoding="utf8"))

THUMB_W, THUMB_H, LABEL_H, GAP, COLUMNS = 216, 384, 28, 12, 6
rows = (len(frames) + COLUMNS - 1) // COLUMNS
sheet = Image.new(
    "RGB",
    (COLUMNS * THUMB_W + (COLUMNS + 1) * GAP, rows * (THUMB_H + LABEL_H) + (rows + 1) * GAP),
    (24, 24, 28),
)
draw = ImageDraw.Draw(sheet)
for index, frame in enumerate(frames):
    col, row = index % COLUMNS, index // COLUMNS
    x = GAP + col * (THUMB_W + GAP)
    y = GAP + row * (THUMB_H + LABEL_H + GAP)
    thumb = Image.open(f"{stills_dir}/{frame['file']}").convert("RGB").resize((THUMB_W, THUMB_H), Image.LANCZOS)
    sheet.paste(thumb, (x, y))
    draw.text((x + 4, y + THUMB_H + 6), frame["label"], fill=(235, 235, 235))
sheet.save(out_path)
