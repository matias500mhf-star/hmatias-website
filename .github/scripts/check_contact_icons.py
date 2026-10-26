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

    # Ensure dimensions are separate attributes, not accidentally absorbed into src.
    if re.search(
        r'src="images/contact-(?:email|phone|location)\.svg[^"]*\s+(?:width|height)=',
        html,
        re.IGNORECASE,
    ):
        fail(f"{page} has malformed contact SVG src markup (width/height inside src)")
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
        r'<a\b[^>]*href="tel:' + re.escape("+244948806673") + r'"[^>]*>(.*?)</a>',
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

css = read("premium-editorial.css")
if "body.hmatias-home .service-icon svg{" not in css or "stroke:currentColor" not in css:
    fail("premium-editorial.css must style inline homepage service icons consistently")

# SOURCE AO contact links sit on a dark footer. Guard against the low-contrast
# inherited body text colour that made the email addresses almost unreadable.
source_css = read("source-ao/sourceao.css")
source_page = read("source-ao/index.html")
if ".sitewide-contact-details a{" not in source_css:
    fail("SOURCE AO footer must define an explicit contact-link style")
if "color:#eaf4fb!important" not in source_css or "opacity:1!important" not in source_css:
    fail("SOURCE AO footer email addresses must use high-contrast, fully opaque text")
if "sourceao.css?v=20261026-contact-contrast1" not in source_page:
    fail("SOURCE AO homepage must reference the cache-busted contact-contrast stylesheet")

# The public institutional identity must match the registered company name
# used in the company's registration publication and company profile.
registered_name = "HMATIAS – Prestação de Serviços, (SU), LDA"
for page in ("index.html", "en.html", "credibilidade.html", "credibility.html", "source-ao/index.html"):
    html = read(page)
    if registered_name not in html:
        fail(f"{page} is missing the standard registered company name")
    if "HMATIAS – Prestação de Serviços SU, LDA" in html:
        fail(f"{page} contains the inconsistent company-name variant without (SU)")

if ERRORS:
    print("Contact/icon QA failed:")
    for error in ERRORS:
        print(f" - {error}")
    sys.exit(1)

print("Contact/icon QA passed: PT/EN contact rows, three consistent SVG contact icons, and four service icons verified.")
