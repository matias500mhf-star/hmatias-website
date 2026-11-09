#!/usr/bin/env python3
"""Regression checks for the Portuguese-first Blog consolidation."""
from pathlib import Path
import re
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

require('href="blog/index.html"' in explore, "Portuguese Explore must link to the Blog")
require('href="source-ao/index.html"' in explore, "Portuguese Explore must retain Source AO")
require("<h2>Insights</h2>" not in explore and "insights/index.html" not in explore.lower(),
        "Portuguese Explore must not present a separate Insights section")
require('href="blog/index.html">Blog</a>' in home, "Portuguese homepage footer must link to Blog")
require("insights/index.html" not in home.lower(), "Portuguese homepage footer must not link to a separate Insights section")

require('<h1 id="blog-title">Blog HMATIAS</h1>' in blog, "Blog homepage title is missing")
for topic in ("Procurement e Supply", "Construção", "Facilities", "Gestão Empresarial"):
    require(topic in blog, f"Blog topic is missing: {topic}")
require('href="/insights/' not in blog, "Portuguese Blog homepage must not link to Insights")
require('href="/insights/' not in article, "Portuguese Blog article must not link to Insights")
require("registe também o fornecedor seleccionado" in article.lower(),
        "Decision-record guidance from former Insights must be integrated into Blog")
require('id="sec-6"' in article and "Compare propostas e registe a decisão" in article,
        "Blog guide must expose the consolidated proposal-evaluation section")

require('name="robots" content="noindex,follow"' in legacy_pt,
        "Old Portuguese Insights URL must not remain indexable")
require('rel="canonical" href="' + BASE + '/blog/como-estruturar-pedido-cotacao-fornecimento-angola/"' in legacy_pt,
        "Old Portuguese Insights URL must canonicalize to the consolidated Blog guide")
require('http-equiv="refresh"' in legacy_pt and '#sec-6' in legacy_pt,
        "Old Portuguese Insights URL must redirect to the consolidated evaluation section")

try:
    sitemap = ET.parse(ROOT / "sitemap.xml").getroot()
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9", "xhtml": "http://www.w3.org/1999/xhtml"}
    urls = {node.text.strip() for node in sitemap.findall("sm:url/sm:loc", ns) if node.text}
    require(BASE + "/insights/" not in urls, "Retired Portuguese Insights URL must not be in the main sitemap")
    require(BASE + "/insights/en/" in urls, "English Insights route is retained until the English consolidation phase")
    en_entry = next((node for node in sitemap.findall("sm:url", ns)
                     if node.findtext("sm:loc", namespaces=ns) == BASE + "/insights/en/"), None)
    if en_entry is not None:
        langs = {node.attrib.get("hreflang") for node in en_entry.findall("xhtml:link", ns)}
        require("en" in langs and "pt-AO" not in langs,
                "English sitemap entry must not point to the retired Portuguese URL")
except (OSError, ET.ParseError) as exc:
    errors.append(f"main sitemap cannot be checked: {exc}")

en_head = legacy_en.split("</head>")[0]
require('hreflang="en"' in en_head and not re.search(r'<link rel="alternate" hreflang="pt-AO"', en_head),
        "English legacy Insights page must not advertise the retired Portuguese URL as its language pair")

if errors:
    print("Portuguese Blog consolidation QA failed:")
    for error in errors:
        print(" - " + error)
    sys.exit(1)

print("Portuguese Blog consolidation QA passed: one Blog destination, four topics, integrated evaluation content and a safe legacy redirect.")
