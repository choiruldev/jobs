#!/usr/bin/env python3
"""
Ensure OpenGraph and Twitter Card metadata tags across all HTML pages.
"""

import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def process_html_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    rel_to_root = os.path.relpath(BASE_DIR, os.path.dirname(filepath))
    if rel_to_root == ".":
        og_img_path = "assets/og-cover.png"
    else:
        og_img_path = f"{rel_to_root}/assets/og-cover.png"

    # Social tags to inject if missing
    tags_to_check = {
        'og:image': f'<meta property="og:image" content="{og_img_path}">',
        'og:site_name': '<meta property="og:site_name" content="JobSearch">',
        'twitter:card': '<meta name="twitter:card" content="summary_large_image">',
        'twitter:image': f'<meta name="twitter:image" content="{og_img_path}">'
    }

    injected = []
    for prop, tag in tags_to_check.items():
        if f'property="{prop}"' not in content and f'name="{prop}"' not in content:
            injected.append(tag)

    if injected:
        injection_str = "\n  " + "\n  ".join(injected)
        # Inject right after </title> or after existing meta description
        if '<meta name="description"' in content:
            content = re.sub(r'(<meta name="description"[^>]+>)', r'\1' + injection_str, content, count=1)
        elif '</title>' in content:
            content = content.replace('</title>', '</title>' + injection_str, 1)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return len(injected)
    return 0

total_updated = 0
for root, _, files in os.walk(BASE_DIR):
    if "node_modules" in root or "graphify-out" in root:
        continue
    for file in files:
        if file.endswith(".html"):
            path = os.path.join(root, file)
            count = process_html_file(path)
            if count > 0:
                total_updated += 1

print(f"✓ Selesai memperbarui {total_updated} file HTML dengan tag OpenGraph & Twitter Card.")
