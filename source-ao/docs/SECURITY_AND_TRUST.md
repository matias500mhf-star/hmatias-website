# Source AO — Security & Trust Baseline

## Data classes

### Public
- supplier/company name;
- business location;
- public business website;
- category/specialty;
- reviewed verification status;
- verification time/freshness window;
- public opportunity source.

### Internal
- operator notes;
- verification queue;
- response history;
- supplier outreach history;
- evidence references;
- sourcing-request metadata.

### Restricted
- screenshots of private conversations;
- non-public phone numbers;
- private email threads;
- documents received from suppliers;
- customer identity/contact data;
- pricing negotiated privately;
- internal commercial margins.

Restricted data must never be committed to a public GitHub repository.

## Principle of least exposure
The public interface receives only what is required to make a sourcing decision. Evidence stays private; the UI displays the resulting status and timestamp, not the underlying private conversation.

## Verification integrity
- Status upgrades require a human reviewer.
- Evidence reference is mandatory for direct confirmation.
- Historical observations are immutable; corrections create a new observation.
- Expired confirmations remain in history but are downgraded for current display.
- Conflicting supplier responses block a positive current-status claim until resolved.

## Operator access
Future backend roles:
- Viewer — read public/approved commercial data;
- Operator — create verification requests and supplier outreach;
- Reviewer — approve/reject supplier confirmations;
- Administrator — manage data sources, users and policy.

No single automated process should have permission to both ingest evidence and approve commercial verification.

## Supplier response links
Future supplier confirmation links must:
- use signed, short-lived tokens;
- be scoped to one verification request;
- expire automatically;
- prevent editing after submission;
- log IP/session metadata only where legally and operationally appropriate;
- never reveal customer identity unless necessary and consented.

## Search and AI
AI may:
- normalise spelling;
- identify aliases;
- classify categories;
- extract structured fields from supplier responses;
- detect contradictions;
- rank candidate suppliers.

AI may not:
- invent suppliers;
- infer stock from a general catalogue;
- mark a supplier as confirmed without reviewed evidence;
- create a current price from an old listing;
- silently merge conflicting identities.

## Data retention
Before production, define retention periods for:
- customer sourcing requests;
- supplier confirmations;
- private evidence;
- operator audit logs;
- expired opportunity records.

Public records may remain as historical metadata only when they no longer imply current availability.

## Incident rule
If a public result is proven wrong or stale:
1. downgrade immediately to `needs_reconfirmation` or `unavailable`;
2. preserve the audit record;
3. correct the source mapping;
4. review whether similar records share the same faulty source;
5. do not hide the failure by overwriting history.
