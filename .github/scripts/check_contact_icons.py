#!/usr/bin/env python3
"""Guard the public homepage contact SVGs and service icon fallback rendering."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
ERRORS = []


def fail(message):
    ERRORS.append(message)


def read(path):
    target = ROOT / path
    if not target.is_file():
        fail(f"required file is missing: {path}")
        return ""
    return target.read_text(encoding="utf-8")


# Image-based SVGs must declare their stroke colour explicitly. currentColor does
# not inherit CSS colour through an external <img> or CSS background-image.
for path in (
    "images/contact-email.svg",
    "images/contact-phone.svg",
    "images/contact-location.svg",
):
    svg = read(path)
    if 'viewBox="0 0 24 24"' not in svg:
        fail(f"{path} must use the common 24x24 icon grid")
    if 'stroke="#0B477C"' not in svg:
        fail(f"{path} must use the shared HMATIAS navy stroke")
    if "currentColor" in svg:
        fail(f"{path} must not depend on currentColor when used as an external image")
    if "stroke-linecap=\"round\"" not in svg or "stroke-linejoin=\"round\"" not in svg:
        fail(f"{path} must use consistent rounded line geometry")

for page, locale in (("index.html", "pt"), ("en.html", "en")):
    html = read(page)
    section_match = re.search(
        r'<section\s+class="contact"[^>]*>(.*?)</section>',
        html,
        re.IGNORECASE | re.DOTALL,
    )
    if not section_match:
        fail(f"{page} is missing the homepage contact section")
        continue
    section = section_match.group(1)

    for email in ("geral@comercialhmatiasps.com", "info@comercialhmatiasps.com"):
        link = re.search(
            r'<a\b[^>]*href="mailto:' + re.escape(email) + r'"[^>]*>(.*?)</a>',
            section,
            re.IGNORECASE | re.DOTALL,
        )
        if not link:
            fail(f"{page} is missing the contact link for {email}")
        elif "images/contact-email.svg" not in link.group(1) or "contact-list-icon" not in link.group(1):
            fail(f"{page} email link {email} must include the visible contact email SVG")

    phone = re.search(
        r'<a\b[^>]*href="tel:\\+244948806673"[^>]*>(.*?)</a>',
        section,
        re.IGNORECASE | re.DOTALL,
    )
    if not phone or "images/contact-phone.svg" not in phone.group(1):
        fail(f"{page} must show the phone icon beside the commercial phone")

    if "images/contact-location.svg" not in section:
        fail(f"{page} must show the location icon beside the office address")

    icon_blocks = re.findall(
        r'<div\s+class="service-icon"\s+aria-hidden="true">(.*?)</div>',
        html,
        re.IGNORECASE | re.DOTALL,
    )
    if len(icon_blocks) != 4:
        fail(f"{page} must provide four service icons; found {len(icon_blocks)}")
    elif any("<svg" not in block or 'stroke="currentColor"' not in block for block in icon_blocks):
        fail(f"{page} service icons must have modern inline SVG fallbacks")

enhancements = read("site-enhancements.js")
icon_array = re.search(r"const icons = \[(.*?)\n\s*\];", enhancements, re.DOTALL)
if not icon_array:
    fail("site-enhancements.js is missing the homepage service SVG array")
else:
    count = icon_array.group(1).count("<svg")
    if count != 4:
        fail(f"site-enhancements.js must define four service icons; found {count}")

css = read("home-base.css")
if ".service-icon svg{" not in css or "stroke:currentColor" not in css:
    fail("home-base.css must style inline service icons consistently")

if ERRORS:
    print("Contact/icon QA failed:")
    for error in ERRORS:
        print(f" - {error}")
    sys.exit(1)

print("Contact/icon QA passed: PT/EN contact rows, three consistent SVG contact icons, and four service icons verified.")
