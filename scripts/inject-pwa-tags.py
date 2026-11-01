#!/usr/bin/env python3
"""
Injects PWA manifest, favicon, apple-touch-icon, and theme-color into all HTML pages.
"""

import glob
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

root_tag = """  <link rel="icon" type="image/svg+xml" href="favicon.svg">
  <link rel="alternate icon" href="favicon.ico">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#006a6a">
"""

pages_tag = """  <link rel="icon" type="image/svg+xml" href="../favicon.svg">
  <link rel="alternate icon" href="../favicon.ico">
  <link rel="apple-touch-icon" href="../apple-touch-icon.png">
  <link rel="manifest" href="../manifest.json">
  <meta name="theme-color" content="#006a6a">
"""

def inject(filepath, is_subfolder):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'rel="manifest"' in content or "rel='manifest'" in content:
        print(f"Skipping (already present): {filepath}")
        return

    tag_to_insert = pages_tag if is_subfolder else root_tag

    # Insert before <link rel="preconnect" or <link rel="stylesheet"
    if '<link rel="preconnect"' in content:
        new_content = content.replace('<link rel="preconnect"', tag_to_insert + '  <link rel="preconnect"', 1)
    elif '<link rel="stylesheet"' in content:
        new_content = content.replace('<link rel="stylesheet"', tag_to_insert + '  <link rel="stylesheet"', 1)
    elif '</head>' in content:
        new_content = content.replace('</head>', tag_to_insert + '</head>', 1)
    else:
        print(f"Warning: Could not find insert anchor in {filepath}")
        return

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Injected PWA tags into: {filepath}")

for f in sorted(glob.glob(os.path.join(ROOT_DIR, "*.html"))):
    inject(f, is_subfolder=False)

for f in sorted(glob.glob(os.path.join(ROOT_DIR, "pages", "*.html"))):
    inject(f, is_subfolder=True)

print("Done injecting PWA tags across all pages!")
