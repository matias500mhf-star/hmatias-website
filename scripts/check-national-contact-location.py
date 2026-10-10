#!/usr/bin/env python3
"""Prevent silently assigning Luanda to nationwide customer enquiries.

Checks public PT/EN form semantics and both optional lead transports.
Does not submit customer data, touch production APIs or require secrets.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
errors = []


def require(yes, message):
    if not yes:
        errors.append(message)


for filename in ("index.html", "en.html"):
    html = (ROOT / filename).read_text(encoding="utf-8")
    match = re.search(r'<form\b[^>]*\bid="contactForm"[^>]*>(.*?)</form>', html, re.S)
    require(bool(match), f"{filename}: public contact form not found")
    if not match:
        continue
    form = match.group(1)
    fields = re.findall(r'<input\b[^>]*\bname="location"[^>]*>', form)
    require(len(fields) == 1, f"{filename}: expected exactly one location field")
    if fields:
        field = fields[0]
        require('maxlength="160"' in field, f"{filename}: location maxlength must match backend")
        input_id = re.search(r'\bid="([^"]+)"', field)
        require(bool(input_id), f"{filename}: location field has no ID")
        if input_id:
            require(f'for="{input_id.group(1)}"' in form,
                    f"{filename}: location has no associated label")

auto = (ROOT / "website-lead-client.js").read_text(encoding="utf-8")
legacy = (ROOT / "lead-intake-client.js").read_text(encoding="utf-8")
manual = (ROOT / "script.js").read_text(encoding="utf-8")

require("email:'email',service:'servico',location:'location',details:'mensagem'" in auto,
        "Automatic contact intake must read visitor-provided location")
require("location:get(config.location)," in auto,
        "Automatic intake must preserve supplied location")
require("location:get(config.location)||'Luanda'" not in auto,
        "Automatic intake must not invent a Luanda location")
require("get(config.service),get(config.location),detail(form,config,fd)" in auto,
        "Automatic intake manual fallback must include requested location")
require("location:get(d,'location'),details:get(d,'mensagem')" in legacy,
        "Legacy gated transport must preserve location if ever activated")
require("const location=String(d.get('location')" in manual,
        "Manual form handoff must extract the submitted location")
require("Location: ${location}" in manual and "Localização: ${location}" in manual,
        "Manual WhatsApp/email brief must include location in both languages")

if errors:
    raise SystemExit("\n".join("ERROR: " + error for error in errors))
print("PASS: PT/EN national contact location routing is consistent without invented city.")
