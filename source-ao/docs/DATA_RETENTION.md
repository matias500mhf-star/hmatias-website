# Source AO — Data Retention Baseline

Status: pre-production operational baseline. Public launch remains blocked until every production retention rule is implemented and tested.

## Principles
- Keep only the data required to fulfil sourcing, verification, security and audit needs.
- Separate public commercial facts from private evidence and requester contact data.
- Expiry of a commercial confirmation is not the same as deletion of its audit record.
- Do not retain raw client IP addresses for rate limiting.
- Do not put restricted evidence or contacts in the public GitHub repository.

## Current enforced rules

### Rate-limit windows
- Storage: D1 `rate_limit_windows`.
- Identifier: HMAC-pseudonymized client address; raw address is not stored by Source AO.
- Operational retention: 48 hours.
- Enforcement: daily Worker maintenance cron removes older rows.

### Supplier confirmation links
- Link validity: 48 hours when a verification request is created.
- Open unanswered requests are marked `expired` by daily maintenance after their deadline.
- Submitted supplier responses are one-shot and cannot be silently overwritten.

### Commercial observations
- Current availability expires according to verification status.
- Expired observations remain audit history but the public engine downgrades them to `needs_reconfirmation`.

## Production rules still to implement before launch

### Requester contact data
Target: automatically purge or irreversibly anonymize direct contact data after the operational retention period, while preserving non-identifying demand statistics. Final period must be approved before production.

### Private supplier evidence
Target: define a controlled audit period, then delete private screenshots/documents unless they are required for an active dispute, contract or legal obligation.

### Application/security logs
Target: configure provider log retention to a short operational period and exclude request bodies, search queries, tokens and requester contacts from logs.

### Closed sourcing requests
Target: remove direct contact data separately from the commercial request history so aggregated demand can remain useful without identifying the requester.

## Launch gate
Production is not approved until:
1. requester-contact purge/anonymization is implemented;
2. provider log retention is explicitly configured;
3. private evidence retention is defined;
4. deletion/anonymization is tested in staging;
5. the public Privacy Notice is updated with the final periods.
