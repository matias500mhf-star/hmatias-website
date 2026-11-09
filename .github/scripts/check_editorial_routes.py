#!/usr/bin/env python3
"""Regression checks for the single Blog destination."""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
BASE = "https://comercialhmatiasps.com"
errors = []

def require(condition, message):
    if not condition:
        errors.append(message)

def read(path):
    target = ROOT / path
    require(target.is_file(), f"required file is missing: {path}")
    return target.read_text(encoding="utf-8") if target.is_file() else ""

explore = read("explorar.html")
home = read("index.html")
blog = read("blog/index.html")
article = read("blog/como-estruturar-pedido-cotacao-fornecimento-angola/index.html")
legacy_pt = read("insights/index.html")
legacy_en = read("insights/en/index.html")
en_home = read("en.html")
en_explore = read("explore.html")
en_blog = read("blog/en/index.html")
en_article = read("blog/en/how-to-prepare-a-supply-rfq-angola/index.html")
pt_about = read("credibilidade.html")
en_about = read("credibility.html")

require('href="blog/index.html"' in explore, "Portuguese Explore must link to the Blog")
require('href="source-ao/index.html"' in explore, "Portuguese Explore must retain Source AO")
require("Insights" not in explore, "Portuguese Explore must not present a separate Insights section")
require('href="blog/index.html">Blog</a>' in home, "Portuguese homepage footer must link to Blog")
require("insights/index.html" not in home.lower(), "Portuguese homepage footer must not link to Insights")

require('<h1 id="blog-title">Blog HMATIAS</h1>' in blog, "Blog homepage title is missing")
for topic in ("Procurement e Supply", "Construção", "Facilities", "Gestão Empresarial"):
    require(topic in blog, f"Blog topic is missing: {topic}")
require('/insights/' not in blog, "Portuguese Blog homepage must not link to Insights")
require('/insights/' not in article, "Portuguese Blog article must not link to Insights")
require("registe também o fornecedor seleccionado" in article.lower(),
        "Decision-record guidance from former Insights must be integrated into Blog")
require('id="sec-6"' in article and "Compare propostas e registe a decisão" in article,
        "Blog guide must expose the consolidated proposal-evaluation section")

require('name="robots" content="noindex,follow"' in legacy_pt,
        "Old Portuguese Insights URL must not remain indexable")
require('rel="canonical" href="' + BASE + '/blog/como-estruturar-pedido-cotacao-fornecimento-angola/"' in legacy_pt,
        "Old Portuguese Insights URL must canonicalize to the consolidated Blog guide")
require('http-equiv="refresh"' in legacy_pt and '#sec-6' in legacy_pt,
        "Old Portuguese Insights URL must redirect to the evaluation section")

require("insights" not in en_home.lower(), "English homepage must not link to separate Insights")
require("insights" not in pt_about.lower(), "Portuguese company profile must not link to separate Insights")
require("insights" not in en_about.lower(), "English company profile must not link to separate Insights")
require("insights/en/" not in en_explore.lower() and "<h2>Insights</h2>" not in en_explore, "English Explore must not present a separate Insights destination")
require("/insights/en/" not in en_blog, "English Blog homepage must not link to Insights")
require("/insights/en/" not in en_article, "English Blog article must not link to Insights")
en_head = legacy_en.split("</head>")[0]
require('name="robots" content="noindex,follow"' in en_head, "Old English Insights URL must not remain indexable")
require('rel="canonical" href="' + BASE + '/blog/en/"' in en_head, "Old English Insights URL must canonicalize to the English Blog")
require('http-equiv="refresh"' in en_head and BASE + '/blog/en/' in en_head,
        "Old English Insights URL must redirect to the English Blog")

try:
    sitemap = ET.parse(ROOT / "sitemap.xml").getroot()
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = {node.text.strip() for node in sitemap.findall("sm:url/sm:loc", ns) if node.text}
    require(BASE + "/insights/" not in urls, "Retired Portuguese Insights URL must not be in sitemap")
    require(BASE + "/insights/en/" not in urls, "Retired English Insights URL must not be in sitemap")
except (OSError, ET.ParseError) as exc:
    errors.append(f"main sitemap cannot be checked: {exc}")


# Premium-site regression checks: one editorial destination, clean markup and navigation.
internal_pages = (
    "construcao.html", "construction.html", "facilities.html", "facilities-en.html",
    "supply.html", "supply-en.html", "servicos-administrativos.html", "business-services.html",
)
for page in internal_pages:
    content = read(page)
    footer = content.split('<footer class="hm-global-footer"', 1)[-1].split("</footer>", 1)[0]
    require("Insights" not in footer, f"{page} footer must not show a retired Insights destination")
    require("blog/" in footer, f"{page} footer must retain the Blog destination")
for page in ("supply.html", "supply-en.html", "explorar.html", "explore.html"):
    require(r"\\n" not in read(page), f"{page} must not contain literal \\n escape tokens")
for page in ("explorar.html", "explore.html"):
    content = read(page)
    require('hmatias-header' in content, f"{page} must use the shared institutional header")
    require('class="menu-toggle"' in content and 'class="nav-menu"' in content,
            f"{page} must retain the responsive navigation controls")
    require("<span><h2>" not in content, f"{page} must not wrap block headings in inline span elements")
    require("<div><h2>" in content, f"{page} must use block containers for card content")
    require('href="blog/' in content and 'href="source-ao/index.html"' in content,
            f"{page} must link to Blog and Source AO")

if errors:
    print("Blog consolidation QA failed:")
    for error in errors:
        print(" - " + error)
    sys.exit(1)
print("Blog consolidation QA passed: one Blog destination, four Portuguese topics, evaluation guidance integrated and both legacy Insights routes safely redirected.")
