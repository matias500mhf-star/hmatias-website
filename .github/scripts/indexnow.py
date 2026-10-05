#!/usr/bin/env python3
"""Notify IndexNow after publication. Dry-run by default; no private data is read."""

import argparse
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import subprocess
import time
from urllib.error import URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
HOST = "comercialhmatiasps.com"
BASE = f"https://{HOST}"
KEY_FILE = "indexnow-key.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"
PRIVATE_PREFIXES = (
    ".", "docs/", "cloudflare-ai/", "source-ao/backend/", "source-ao/docs/",
    "source-ao/schemas/", "source-ao/data/", "source-ao/ops.",
    "source-ao/review.", "source-ao/requests.",
)
PUBLIC_DATA = {f"source-ao/data/{name}.json" for name in
               ("catalog", "opportunities", "source-registry")}


def git(*args, required=True):
    result = subprocess.run(["git", *args], cwd=ROOT, text=True,
                            capture_output=True, check=required)
    return result.stdout if result.returncode == 0 else None


def page_path(url):
    parsed = urlsplit(url)
    path = parsed.path.lstrip("/")
    if (parsed.scheme != "https" or parsed.netloc != HOST or parsed.query
            or parsed.fragment or not parsed.path.startswith("/")
            or not re.fullmatch(r"[A-Za-z0-9_./-]*", path)
            or ".." in path.split("/") or path.startswith(PRIVATE_PREFIXES)
            or not (parsed.path.endswith("/") or parsed.path.endswith(".html"))):
        raise ValueError(f"Refusing non-public page URL: {url}")
    return path + "index.html" if parsed.path.endswith("/") else path


def sitemap_pages(xml):
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    pages = {}
    for node in ET.fromstring(xml).findall("s:url/s:loc", ns):
        url = (node.text or "").strip()
        pages[url] = page_path(url)
    if not pages or len(pages) > 10000:
        raise ValueError("Sitemap must contain 1 to 10,000 public pages")
    return pages


class PageSignals(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = None
        self.noindex = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link" and "canonical" in attrs.get("rel", "").lower().split():
            self.canonical = attrs.get("href")
        if tag == "meta" and attrs.get("name", "").lower() in ("robots", "bingbot"):
            directives = re.split(r"[\s,]+", attrs.get("content", "").lower())
            self.noindex |= bool({"noindex", "none"}.intersection(directives))


def current_pages():
    pages = sitemap_pages((ROOT / "sitemap.xml").read_text())
    robots = RobotFileParser()
    robots.parse((ROOT / "robots.txt").read_text().splitlines())
    for url, path in pages.items():
        signals = PageSignals()
        signals.feed((ROOT / path).read_text(encoding="utf-8"))
        if signals.noindex or not robots.can_fetch("bingbot", url):
            raise ValueError(f"Sitemap page is excluded from indexing: {url}")
        if signals.canonical != url:
            raise ValueError(f"Sitemap/canonical mismatch: {url}")
    return pages


def changed_urls(current, previous, changed):
    affected = set(current).symmetric_difference(previous)
    for url, path in {**previous, **current}.items():
        if path in changed:
            affected.add(url)
    # Shared public assets can affect every commercial page. Internal changes do not.
    for path in changed:
        if path in PUBLIC_DATA:
            affected.update(url for url in current if "/source-ao/" in url)
        elif not path.startswith(PRIVATE_PREFIXES) and (
                path == "robots.txt" or Path(path).suffix.lower() in
                {".css", ".js", ".jpg", ".jpeg", ".png", ".webp", ".svg", ".avif", ".woff2"}):
            affected.update(current)
    return sorted(affected)


def select_urls(current, before, all_pages=False):
    if all_pages or not before or set(before) == {"0"}:
        return sorted(current)
    if not re.fullmatch(r"[a-fA-F0-9]{40}", before):
        raise ValueError("Baseline must be a full Git commit SHA")
    previous_xml = git("show", f"{before}:sitemap.xml", required=False)
    previous_key = git("show", f"{before}:{KEY_FILE}", required=False)
    if previous_xml is None or previous_key is None:
        return sorted(current)  # Initial IndexNow activation.
    previous = sitemap_pages(previous_xml)
    changed = set(git("diff", "--name-only", before, "HEAD", "--").splitlines())
    if KEY_FILE in changed:
        return sorted(current)
    return changed_urls(current, previous, changed)


def get_published(url):
    for attempt in range(3):
        try:
            request = Request(url, headers={"User-Agent": "HMATIAS-IndexNow/1.0"})
            with urlopen(request, timeout=20) as response:
                return response.read(2000000).decode("utf-8")
        except (URLError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--submit", action="store_true")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--before", default=os.environ.get("INDEXNOW_BEFORE", ""))
    args = parser.parse_args()
    current = current_pages()
    urls = select_urls(current, args.before, args.all)
    print(json.dumps({"mode": "submit" if args.submit else "dry-run",
                      "count": len(urls), "urls": urls}, ensure_ascii=False))
    if not args.submit or not urls:
        return
    key = (ROOT / KEY_FILE).read_text().strip()
    if not re.fullmatch(r"[a-zA-Z0-9-]{8,128}", key):
        raise ValueError("Invalid IndexNow verification key")
    key_location = f"{BASE}/{KEY_FILE}"
    if get_published(key_location).strip() != key:
        raise ValueError("Published IndexNow key does not match this release")
    published = sitemap_pages(get_published(f"{BASE}/sitemap.xml"))
    if any(url in current and url not in published for url in urls):
        raise ValueError("Wait until the current public sitemap is published")
    payload = json.dumps({"host": HOST, "key": key, "keyLocation": key_location,
                          "urlList": urls}).encode("utf-8")
    request = Request(ENDPOINT, data=payload, method="POST",
                      headers={"Content-Type": "application/json; charset=utf-8",
                               "User-Agent": "HMATIAS-IndexNow/1.0"})
    # Do not retry POSTs: an ambiguous timeout may already have been accepted.
    with urlopen(request, timeout=30) as response:
        status = response.status
    if status not in (200, 202):
        raise ValueError(f"Unexpected IndexNow response: HTTP {status}")
    detail = "received" if status == 200 else "received; key validation pending"
    message = f"IndexNow: {len(urls)} public URLs {detail} (HTTP {status}). Indexing is not guaranteed."
    print(message)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as out:
            out.write(f"## IndexNow\n\n{message}\n")


if __name__ == "__main__":
    main()
