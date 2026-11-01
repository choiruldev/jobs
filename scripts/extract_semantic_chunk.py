#!/usr/bin/env python3
"""
Extract semantic knowledge graph fragment for uncached HTML and image files in JobSearch.
Adheres strictly to graphify extraction-spec schema and coverage rules.
"""

import os
import re
import json
from pathlib import Path

ROOT = Path("/Users/irul/Documents/PROJECT/jobseekers")
UNCACHED_FILE = ROOT / "graphify-out" / ".graphify_uncached.txt"
CHUNK_OUT = ROOT / "graphify-out" / ".graphify_chunk_01.json"

uncached_paths = [line.strip() for line in UNCACHED_FILE.read_text(encoding="utf-8").splitlines() if line.strip()]

nodes = []
edges = []
hyperedges = []
coverage = {}

def normalize_stem(path_str):
    rel = os.path.relpath(path_str, ROOT)
    base = os.path.splitext(rel)[0]
    segments = re.split(r'[/\\_]+', base)
    clean_segs = [re.sub(r'[^a-z0-9]', '', s.lower()) for s in segments if s]
    return "_".join(clean_segs)

for file_path in uncached_paths:
    p = Path(file_path)
    if not p.is_file():
        continue

    stem = normalize_stem(file_path)

    if p.suffix.lower() == ".html":
        lines = p.read_text(encoding="utf-8", errors="replace").splitlines()
        coverage[file_path] = len(lines)
        content = "\n".join(lines)

        # Extract title
        m_title = re.search(r'<title>([^<]+)</title>', content, re.IGNORECASE)
        title = m_title.group(1).strip() if m_title else p.stem

        page_node_id = f"{stem}_page"
        nodes.append({
            "id": page_node_id,
            "label": title,
            "file_type": "document",
            "source_file": file_path,
            "source_location": None,
            "source_url": None,
            "captured_at": None,
            "author": None,
            "contributor": None
        })

        # Extract scripts loaded
        scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', content, re.IGNORECASE)
        for s in scripts:
            clean_s = s.split("?")[0]
            script_stem = normalize_stem(os.path.normpath(os.path.join(p.parent, clean_s)))
            # Link to script
            edges.append({
                "source": page_node_id,
                "target": f"{script_stem}",
                "relation": "references",
                "confidence": "EXTRACTED",
                "confidence_score": 1.0,
                "source_file": file_path,
                "source_location": None,
                "weight": 1.0
            })

        # Extract internal links
        links = re.findall(r'<a[^>]+href=["\']([^"\']+)["\']', content, re.IGNORECASE)
        for target in set(links):
            if target.startswith("http") or target.startswith("#") or target.startswith("mailto"):
                continue
            clean_target = target.split("?")[0].split("#")[0]
            if clean_target.endswith(".html"):
                target_stem = normalize_stem(os.path.normpath(os.path.join(p.parent, clean_target)))
                target_node_id = f"{target_stem}_page"
                edges.append({
                    "source": page_node_id,
                    "target": target_node_id,
                    "relation": "references",
                    "confidence": "EXTRACTED",
                    "confidence_score": 1.0,
                    "source_file": file_path,
                    "source_location": None,
                    "weight": 1.0
                })

    elif p.suffix.lower() in [".png", ".svg", ".ico"]:
        coverage[file_path] = 1
        icon_node_id = f"{stem}_asset"
        nodes.append({
            "id": icon_node_id,
            "label": f"PWA Asset {p.name}",
            "file_type": "image",
            "source_file": file_path,
            "source_location": None,
            "source_url": None,
            "captured_at": None,
            "author": None,
            "contributor": None
        })

# Hyperedge for PWA Core Views
html_nodes = [n["id"] for n in nodes if n["file_type"] == "document"]
if len(html_nodes) >= 3:
    hyperedges.append({
        "id": "pwa_application_routes",
        "label": "JobSearch Web Application Routes",
        "nodes": html_nodes[:15],
        "relation": "form",
        "confidence": "INFERRED",
        "confidence_score": 0.85,
        "source_file": uncached_paths[0]
    })

result = {
    "nodes": nodes,
    "edges": edges,
    "hyperedges": hyperedges,
    "input_tokens": 0,
    "output_tokens": 0,
    "coverage": coverage
}

CHUNK_OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"Extracted {len(nodes)} nodes, {len(edges)} edges, {len(coverage)} files covered -> {CHUNK_OUT}")
