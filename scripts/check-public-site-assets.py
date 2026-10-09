#!/usr/bin/env python3
"""Validate deployed HMATIAS sitemap pages and repository-backed local assets.

This checks file-backed references, not live Cloudflare redirects, JS-generated
URLs, third-party resources, Google indexing or external API availability.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = "comercialhmatiasps.com"
errors = []
visited = 0
checked = 0

def local_path(raw, page):
    raw = (raw or "").strip()
    if not raw or raw.startswith(("#", "data:", "blob:", "mailto:", "tel:", "javascript:")):
        return None
    url = urlparse(raw)
    if url.scheme and url.scheme not in ("http", "https"):
        return None
    if url.netloc and url.hostname not in (ORIGIN, "www." + ORIGIN):
        return None
    if raw.startswith("//") and url.hostname not in (ORIGIN, "www." + ORIGIN):
        return None
    address = unquote(url.path)
    if not address:
        return page
    if address.startswith("/"):
        fragment = address.lstrip("/")
    else:
        fragment = str(page.parent / address)
    # Directories use an index document even when Path normalisation has
    # removed the trailing slash (e.g. "source-ao/" or "../").
    if address.endswith("/") or not fragment:
        fragment = str(Path(fragment) / "index.html")
    # Canonical destination must stay inside the repository.
    candidate = (ROOT / fragment).resolve()
    if not candidate.is_relative_to(ROOT.resolve()):
        errors.append(f"Path escapes repository: {page}: {raw}")
        return None
    return candidate.relative_to(ROOT.resolve())

class Refs(HTMLParser):
    def __init__(self, page):
        super().__init__(convert_charrefs=True)
        self.page = page
    def handle_starttag(self, tag, attrs):
        global checked
        attrs = dict(attrs)
        for attr in ("src", "href", "poster"):
            if attr not in attrs:
                continue
            # Navigation, stylesheet, scripts, visible images and source URLs.
            if attr == "href" and tag not in ("a", "link", "area"):
                continue
            if attr == "src" and tag not in ("img", "script", "source", "video", "audio", "iframe"):
                continue
            relative = local_path(attrs[attr], self.page)
            if relative is None:
                continue
            checked += 1
            if not (ROOT / relative).is_file():
                errors.append(f"{self.page}: missing {tag}[{attr}] -> {attrs[attr]} ({relative})")
        if "srcset" in attrs and tag in ("img", "source"):
            for component in attrs["srcset"].split(","):
                raw = component.strip().split()[0] if component.strip() else ""
                relative = local_path(raw, self.page)
                if relative is None:
                    continue
                checked += 1
                if not (ROOT / relative).is_file():
                    errors.append(f"{self.page}: missing {tag}[srcset] -> {raw} ({relative})")

sitemap = ROOT / "sitemap.xml"
tree = ET.parse(sitemap)
ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
pages = []
for node in tree.getroot().findall("s:url", ns):
    element = node.find("s:loc", ns)
    if element is None or not element.text:
        continue
    url = element.text.strip()
    relative = local_path(url, Path("index.html"))
    if relative is None:
        errors.append(f"Unexpected off-domain canonical sitemap entry: {url}")
        continue
    if (ROOT / relative).suffix.lower() != ".html":
        errors.append(f"Sitemap entry is not an HTML page: {url}")
        continue
    if not (ROOT / relative).is_file():
        errors.append(f"Sitemap canonical has no local HTML file: {url}")
        continue
    pages.append(relative)

for page in sorted(set(pages)):
    visited += 1
    Refs(page).feed((ROOT / page).read_text(encoding="utf-8"))
if errors:
    print("HMATIAS PUBLIC FILE REFERENCES FAILED:")
    for problem in errors:
        print(" - " + problem)
    raise SystemExit(1)
print(f"PASS: {visited} sitemap pages and {checked} local HTML asset/link references resolve to tracked files.")
