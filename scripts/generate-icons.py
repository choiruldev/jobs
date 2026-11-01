#!/usr/bin/env python3
"""
Generate PWA and Apple Touch icons for JobSearch.
Uses macOS native qlmanage and sips to render pixel-perfect PNGs.
"""

import os
import subprocess
import shutil

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets", "icons")
CSS_DIR = os.path.join(BASE_DIR, "css")
TMP_DIR = "/tmp/jobsearch_icons"

os.makedirs(ASSETS_DIR, exist_ok=True)
os.makedirs(CSS_DIR, exist_ok=True)
os.makedirs(TMP_DIR, exist_ok=True)

# 1. Base standard SVG (for normal icon with rounded corners)
base_svg = os.path.join(BASE_DIR, "favicon.svg")

# 2. Maskable SVG (full bleed background, centered 80% safe zone symbol)
maskable_svg = os.path.join(TMP_DIR, "maskable.svg")
with open(maskable_svg, "w") as f:
    f.write('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#1565C0"/>
  <g transform="translate(3.2, 3.2) scale(0.8)">
    <path d="M22 10h-3V8c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v2H10c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V12c0-1.1-.9-2-2-2zm-7-2h2v2h-2V8zm7 16H10V14h12v10z" fill="#FFFFFF"/>
  </g>
</svg>''')

# Render standard 512
subprocess.run(["qlmanage", "-t", "-s", "512", "-o", TMP_DIR, base_svg], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
base_png_512 = os.path.join(TMP_DIR, "favicon.svg.png")

# Render maskable 512
subprocess.run(["qlmanage", "-t", "-s", "512", "-o", TMP_DIR, maskable_svg], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
maskable_png_512 = os.path.join(TMP_DIR, "maskable.svg.png")

# Target copies and sizes
targets = [
    # (source_png, target_path, width, height)
    (base_png_512, os.path.join(ASSETS_DIR, "icon-512.png"), 512, 512),
    (base_png_512, os.path.join(ASSETS_DIR, "icon-192.png"), 192, 192),
    (base_png_512, os.path.join(ASSETS_DIR, "apple-touch-icon.png"), 180, 180),
    (base_png_512, os.path.join(ASSETS_DIR, "favicon-32.png"), 32, 32),
    (maskable_png_512, os.path.join(ASSETS_DIR, "icon-maskable.png"), 512, 512),
    # Also support css/ directory legacy paths
    (base_png_512, os.path.join(CSS_DIR, "icon-512.png"), 512, 512),
    (base_png_512, os.path.join(CSS_DIR, "icon-192.png"), 192, 192),
    (base_png_512, os.path.join(BASE_DIR, "apple-touch-icon.png"), 180, 180),
]

for src, dst, w, h in targets:
    shutil.copyfile(src, dst)
    if (w, h) != (512, 512):
        subprocess.run(["sips", "-z", str(h), str(w), dst], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Generated: {dst} ({w}x{h})")

print("All PWA icons successfully generated!")
