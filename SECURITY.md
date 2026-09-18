# HMATIAS Website — Security Policy

## Scope
This policy covers the official HMATIAS website at `comercialhmatiasps.com` and custom code maintained in this repository.

## Reporting a vulnerability
Security issues should be reported privately through HMATIAS official business channels. Do not publish exploitable details, credentials, personal data, customer information or proof-of-concept material that could expose visitors or HMATIAS systems.

## Access control
Administrative access to GitHub, the domain registrar, Cloudflare/DNS, analytics, business email and deployment services should use unique credentials and multi-factor authentication. Access should be limited to authorised HMATIAS personnel or explicitly authorised contractors.

## Secrets
API keys, private tokens, passwords, recovery codes, signing keys and other secrets must never be committed to this repository. Where an integration requires a secret, use the provider's protected secret-management mechanism.

## Deployment integrity
Production changes should be traceable to source-control commits. Avoid direct untracked edits to the live website. Preserve known-good versions so that a compromised or defective deployment can be rolled back.

## Third-party dependencies
External libraries and services remain subject to their own security and licence terms. Review third-party changes before adopting them.

Copyright © 2026 HMATIAS – Prestação de Serviços, (SU), LDA. All rights reserved.
