# Source AO — Data Retention Baseline

Status: pre-production operational baseline. Public launch remains blocked until provider log retention and private-evidence retention are finalized and staging deletion tests pass.

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

### Requester contact data
- Direct contact is encrypted at intake.
- Daily maintenance purges the encrypted contact and masked contact hint for requests whose status is `completed` or `closed` and whose retention period has elapsed.
- The non-identifying commercial request record remains available for aggregate Demand Radar analysis.
- Staging retention is 30 days to make lifecycle testing practical.
- The current production baseline is 365 days and must be confirmed before launch.
- Readiness fails when the contact retention window is absent or outside the allowed 30–1095 day range.

### Commercial observations
- Current availability expires according to verification status.
- Expired observations remain audit history but the public engine downgrades them to `needs_reconfirmation`.

## Production rules still to finalize before launch

### Private supplier evidence
Define a controlled audit period, then delete private screenshots/documents unless they are required for an active dispute, contract or legal obligation.

### Application/security logs
Configure provider log retention to a short operational period. Application logs already exclude request bodies, search queries, requester contacts, confirmation tokens and tracking tokens.

## Launch gate
Production is not approved until:
1. contact purge is exercised successfully in staging;
2. provider log retention is explicitly configured;
3. private evidence retention is defined;
4. deletion/anonymization is tested in staging;
5. the public Privacy Notice is updated with the final approved periods.
