"""HMATIAS release gate: one navigation contract across PT/EN pages.

Run: python3 .github/scripts/check_header_consistency.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
pages = []
problems = []

for page in sorted(ROOT.glob("*.html")):
    html = page.read_text(encoding="utf-8")
    if '<nav class="nav-menu"' not in html or 'header.css?' not in html:
        continue
    pages.append(page.name)
    nav = re.search(r'<nav class="nav-menu"[^>]*>.*?</nav>', html, re.S)
    actions = re.search(r'<div class="nav-actions">.*?</div>', html, re.S)
    if not nav or not actions:
        problems.append(f"{page.name}: missing shared navigation/action structure")
        continue
    switches = re.findall(r'<a\b[^>]*class="lang-switch"[^>]*>', actions.group())
    if len(switches) != 1 or switches[0].count('data-lang-switch') != 1:
        problems.append(f"{page.name}: expected exactly one declared language switch")
    else:
        language = re.search(r'<html\b[^>]*lang="([^"]+)', html)
        expected = 'pt-AO' if language and language.group(1) == 'en' else 'en'
        if f'hreflang="{expected}"' not in switches[0]:
            problems.append(f"{page.name}: switch should lead to {expected} variant")
    if "header.css?v=20261010-freeze1" not in html:
        problems.append(f"{page.name}: stale global navigation stylesheet")
    if "script.js?v=20261010-freeze1" not in html:
        problems.append(f"{page.name}: stale mobile navigation controller")
    if page.name in ("en.html", "credibility.html", "work-catalogue.html", "karta-en.html"):
        if 'About us' not in nav.group():
            problems.append(f"{page.name}: mixed English About us navigation")

if len(pages) != 22:
    problems.append(f"Expected 22 institutional/home pages with shared navigation, found {len(pages)}")

css = (ROOT / "header.css").read_text(encoding="utf-8")
js = (ROOT / "script.js").read_text(encoding="utf-8")
required_css = (
    '.mobile-lang-switch,.mobile-whatsapp-link,.mobile-email-link,.mobile-quote-link',
    'display:none!important',
    'display:flex!important',
    '@media(max-width:850px)',
)
for fragment in required_css:
    if fragment not in css:
        problems.append(f"header.css missing mobile/desktop contract: {fragment}")
if '.nav-actions a.btn-primary[href]' not in js:
    problems.append("script.js must clone the primary CTA, not an injected secondary action")

if problems:
    raise SystemExit("Responsive header audit FAILED:\n" + "\n".join(problems))
print(f"Responsive header audit OK: {len(pages)} PT/EN pages, one declared language toggle per header.")
