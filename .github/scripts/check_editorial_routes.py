#!/usr/bin/env python3
"""Prevent the Blog and Insights sections from collapsing into the same route."""
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
errors = []

def require(condition, message):
    if not condition:
        errors.append(message)

def read(path):
    target = ROOT / path
    require(target.is_file(), f"required editorial page is missing: {path}")
    return target.read_text(encoding="utf-8") if target.is_file() else ""

def card_target(html, title, page):
    match = re.search(
        r'<h2>\s*' + re.escape(title) + r'\s*</h2>(.*?)</article>',
        html, re.I | re.S
    )
    if not match:
        errors.append(f"{page}: {title} card not found")
        return ""
    link = re.search(r'<a\b[^>]*href="([^"]+)"', match.group(1), re.I)
    if not link:
        errors.append(f"{page}: {title} card has no destination")
        return ""
    return link.group(1)

routes = (
    ("explorar.html", "Blog", "blog/index.html", "Insights", "insights/index.html"),
    ("explore.html", "Blog", "blog/en/index.html", "Insights", "insights/en/index.html"),
)
for page, blog_label, blog_expected, insights_label, insights_expected in routes:
    html = read(page)
    blog = card_target(html, blog_label, page)
    insights = card_target(html, insights_label, page)
    require(blog == blog_expected, f"{page}: Blog must link to {blog_expected}, found {blog!r}")
    require(insights == insights_expected, f"{page}: Insights must link to {insights_expected}, found {insights!r}")
    require(blog != insights, f"{page}: Blog and Insights must have distinct destinations")

for path in (
    "blog/index.html", "blog/en/index.html",
    "insights/index.html", "insights/en/index.html",
):
    read(path)

for page, blog_link, insights_link in (
    ("index.html", 'href="blog/index.html">Blog</a>', 'href="insights/index.html">Insights</a>'),
    ("en.html", 'href="blog/en/index.html">Blog</a>', 'href="insights/en/index.html">Insights</a>'),
):
    html = read(page)
    require(blog_link in html, f"{page}: distinct Blog footer link is missing")
    require(insights_link in html, f"{page}: distinct Insights footer link is missing")

for page, insight_href in (
    ("blog/index.html", 'href="/insights/">Insights</a>'),
    ("blog/en/index.html", 'href="/insights/en/">Insights</a>'),
):
    html = read(page)
    require(insight_href in html, f"{page}: link to its language-specific Insights page is missing")

try:
    sitemap = ET.parse(ROOT / "sitemap.xml").getroot()
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = {node.text.strip() for node in sitemap.findall("sm:url/sm:loc", ns) if node.text}
    for url in (
        "https://comercialhmatiasps.com/insights/",
        "https://comercialhmatiasps.com/insights/en/",
    ):
        require(url in urls, f"main sitemap is missing {url}")
except (OSError, ET.ParseError) as exc:
    errors.append(f"main sitemap cannot be checked: {exc}")

if errors:
    print("Editorial route QA failed:")
    for error in errors:
        print(" - " + error)
    sys.exit(1)

print("Editorial route QA passed: Blog and Insights have distinct PT/EN pages, navigation links and sitemap entries.")
