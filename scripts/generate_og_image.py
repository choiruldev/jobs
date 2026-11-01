#!/usr/bin/env python3
"""
Generate high-resolution 1200x630 OpenGraph / Twitter Card preview banner.
Uses macOS native qlmanage and sips.
"""

import os
import subprocess
import shutil

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
TMP_DIR = "/tmp/jobsearch_og"

os.makedirs(ASSETS_DIR, exist_ok=True)
os.makedirs(TMP_DIR, exist_ok=True)

og_svg_path = os.path.join(TMP_DIR, "og-cover.svg")

svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#004d4d" />
      <stop offset="60%" stop-color="#006a6a" />
      <stop offset="100%" stop-color="#002f2f" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <!-- Accent Circle Geometry -->
  <circle cx="1080" cy="120" r="320" fill="#00838f" opacity="0.18" />
  <circle cx="150" cy="580" r="240" fill="#4db6ac" opacity="0.12" />

  <!-- Container Box -->
  <rect x="80" y="75" width="1040" height="480" rx="24" fill="url(#cardGrad)" stroke="#80cbc4" stroke-opacity="0.25" stroke-width="2" />

  <!-- Logo Mark -->
  <rect x="130" y="125" width="76" height="76" rx="18" fill="#4db6ac" />
  <g transform="translate(142, 137) scale(2.15)">
    <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill="#00363a"/>
  </g>

  <!-- Brand Text -->
  <text x="230" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" fill="#ffffff" letter-spacing="-0.5">JobSearch</text>
  <text x="440" y="178" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" fill="#80cbc4" letter-spacing="1.5">INDONESIA</text>

  <!-- Main Headline -->
  <text x="130" y="275" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="800" fill="#ffffff">Lowongan Kerja Remote &amp; Global</text>
  <text x="130" y="335" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="500" fill="#b2dfdb">Agregator Cerdas Pencari Kerja Indonesia Bebas Penipuan</text>

  <!-- Feature Pills -->
  <!-- Pill 1 -->
  <rect x="130" y="395" width="260" height="52" rx="26" fill="#003838" stroke="#00838f" stroke-width="1.5" />
  <text x="165" y="428" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#e0f2f1">🔒 100% Zero-Login</text>

  <!-- Pill 2 -->
  <rect x="410" y="395" width="280" height="52" rx="26" fill="#003838" stroke="#00838f" stroke-width="1.5" />
  <text x="445" y="428" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#e0f2f1">📄 ATS Resume Builder</text>

  <!-- Pill 3 -->
  <rect x="710" y="395" width="280" height="52" rx="26" fill="#003838" stroke="#00838f" stroke-width="1.5" />
  <text x="745" y="428" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#e0f2f1">💰 Kalkulator Gaji PPP</text>

  <!-- Footer text inside card -->
  <text x="130" y="505" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="500" fill="#80cbc4">jobsearch.id • Terhubung dengan Glints, JobStreet, Kalibrr &amp; Global Remote Portals</text>
</svg>'''

with open(og_svg_path, "w") as f:
    f.write(svg_content)

# Render with qlmanage (macOS QuickLook thumbnail generator)
subprocess.run(["qlmanage", "-t", "-s", "1200", "-o", TMP_DIR, og_svg_path],
               check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

rendered_png = os.path.join(TMP_DIR, "og-cover.svg.png")
target_png = os.path.join(ASSETS_DIR, "og-cover.png")

if os.path.exists(rendered_png):
    # Resize exactly to 1200x630 using sips
    subprocess.run(["sips", "-z", "630", "1200", rendered_png, "--out", target_png],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"✓ Berhasil membuat OpenGraph cover image: {target_png} (1200x630)")
else:
    raise FileNotFoundError("Gagal merender PNG dari SVG dengan qlmanage.")
