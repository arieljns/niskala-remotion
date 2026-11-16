"""Compares two PNG frames and prints JSON metrics.

usage: python3 -I image_diff.py <a.png> <b.png>
  pixels_over_16: share of pixels where any channel differs by more than 16 levels
  pixels_over_32: same with 32 levels
  max_level:      the largest single-channel difference
  psnr:           peak signal-to-noise ratio in dB (higher = closer; 99 = identical)
"""
import json
import math
import sys

from PIL import Image, ImageChops

a = Image.open(sys.argv[1]).convert("RGB")
b = Image.open(sys.argv[2]).convert("RGB")
if a.size != b.size:
    print(json.dumps({"size_mismatch": [list(a.size), list(b.size)]}))
    sys.exit(0)

diff = ImageChops.difference(a, b)
width, height = a.size
total = width * height
pixels = list(diff.get_flattened_data()) if hasattr(diff, "get_flattened_data") else list(diff.getdata())
over16 = sum(1 for p in pixels if max(p) > 16)
over32 = sum(1 for p in pixels if max(p) > 32)
max_level = max((max(p) for p in pixels), default=0)
mse = sum(c * c for p in pixels for c in p) / (3 * total)
psnr = 99.0 if mse == 0 else round(10 * math.log10(255 * 255 / mse), 2)
print(json.dumps({
    "pixels_over_16": over16 / total,
    "pixels_over_32": over32 / total,
    "differing_pixels": sum(1 for p in pixels if max(p) > 0),
    "max_level": max_level,
    "psnr": psnr,
    "bbox": diff.getbbox(),
}))
