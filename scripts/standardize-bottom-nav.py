#!/usr/bin/env python3
"""
Standardize bottom-nav across all HTML files to 5 consistent tabs.
"""

import glob
import os
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

pages_bottom_nav = """    <nav class="bottom-nav" aria-label="Navigasi bawah">
      <a class="nav-link" data-nav="search" href="search.html"><span class="nav-link__indicator" aria-hidden="true"></span><span class="material-symbols-outlined" aria-hidden="true">search</span><span>Cari</span></a>
      <a class="nav-link" data-nav="applications" href="apply.html"><span class="nav-link__indicator" aria-hidden="true"></span><span class="material-symbols-outlined" aria-hidden="true">assignment</span><span>Tracker</span></a>
      <a class="nav-link" data-nav="resume" href="resume-builder.html"><span class="nav-link__indicator" aria-hidden="true"></span><span class="material-symbols-outlined" aria-hidden="true">description</span><span>Resume</span></a>
      <a class="nav-link" data-nav="bookmarks" href="bookmarks.html"><span class="nav-link__indicator" aria-hidden="true"></span><span class="material-symbols-outlined" aria-hidden="true">bookmark</span><span>Simpan</span></a>
      <a class="nav-link" data-nav="companies" href="companies.html"><span class="nav-link__indicator" aria-hidden="true"></span><span class="material-symbols-outlined" aria-hidden="true">apartment</span><span>Perusahaan</span></a>
    </nav>"""

root_bottom_nav = """    <nav class="bottom-nav" aria-label="Navigasi bawah">
      <a class="nav-link" data-nav="search" href="pages/search.html"><span class="nav-link__indicator" aria-hidden="true"></span><span class="material-symbols-outlined" aria-hidden="true">search</span><span>Cari</span></a>
      <a class="nav-link" data-nav="applications" href="pages/apply.html"><span class="nav-link__indicator" aria-hidden="true"></span><span class="material-symbols-outlined" aria-hidden="true">assignment</span><span>Tracker</span></a>
      <a class="nav-link" data-nav="resume" href="pages/resume-builder.html"><span class="nav-link__indicator" aria-hidden="true"></span><span class="material-symbols-outlined" aria-hidden="true">description</span><span>Resume</span></a>
      <a class="nav-link" data-nav="bookmarks" href="pages/bookmarks.html"><span class="nav-link__indicator" aria-hidden="true"></span><span class="material-symbols-outlined" aria-hidden="true">bookmark</span><span>Simpan</span></a>
      <a class="nav-link" data-nav="companies" href="pages/companies.html"><span class="nav-link__indicator" aria-hidden="true"></span><span class="material-symbols-outlined" aria-hidden="true">apartment</span><span>Perusahaan</span></a>
    </nav>"""

def update_file(path, is_subfolder):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    replacement = pages_bottom_nav if is_subfolder else root_bottom_nav
    pattern = r'<nav class="bottom-nav".*?</nav>'

    if re.search(pattern, content, re.DOTALL):
        new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated bottom-nav in: {os.path.relpath(path, ROOT_DIR)}")
    else:
        print(f"No bottom-nav found in: {os.path.relpath(path, ROOT_DIR)}")

for f in sorted(glob.glob(os.path.join(ROOT_DIR, "*.html"))):
    update_file(f, is_subfolder=False)

for f in sorted(glob.glob(os.path.join(ROOT_DIR, "pages", "*.html"))):
    # Skip offline.html as it has offline-specific items or we can give it standard 5
    if os.path.basename(f) == "offline.html":
        continue
    update_file(f, is_subfolder=True)

print("Standardization complete!")
