# Source AO — Production & Rollback Runbook

Status: pre-production release procedure.

## Release rules
- Do not publish Source AO from an unreviewed branch.
- Do not expose staging URLs as production.
- Do not copy staging secrets into repository files.
- The HMATIAS production website must remain usable if Source AO is disabled.
- A supplier candidate, catalogue page or public source is never equivalent to current stock.

## Pre-production sequence
1. Merge approved Source AO changes into source-ao-v1.
2. Synchronize source-ao-v1 with current main.
3. Run Source AO Data Quality and require green status.
4. Pin the reviewed Source AO commit in the manual staging launcher on main.
5. Run staging with real lost-client acceptance and contact-retention drill.
6. Rehearse rollback on staging.
7. Restore the reviewed staging release and rerun API/web smoke tests.
8. Review desktop and mobile presentation.
9. Only then prepare PR #33 for explicit production approval.

## Rollback principle
Cloudflare Worker deployments are versioned. A rollback must target a known-good version, not edit the HMATIAS website as an emergency workaround.

Before deploying a candidate:
- record the active API Worker version;
- record the active frontend Worker version;
- confirm D1 and referenced bindings still exist.

For a rollback rehearsal:
1. deploy the recorded baseline API version at 100% traffic;
2. run /ready and API smoke tests;
3. deploy the recorded baseline web version at 100% traffic;
4. run web-isolation smoke tests;
5. redeploy the reviewed candidate API and frontend;
6. rerun smoke tests;
7. verify temporary validation credentials remain disabled.

Wrangler supports deployment/version inspection and version deployment/rollback. Do not roll back across incompatible data-binding or schema changes without checking compatibility first.

## Production failure response
If Source AO fails after launch:
1. stop new Source AO traffic or remove its entry point if necessary;
2. roll back API/frontend to the recorded known-good versions;
3. do not modify unrelated HMATIAS pages as a workaround;
4. verify /ready, public search, private tracking and request intake;
5. downgrade any questionable commercial results to needs_reconfirmation;
6. preserve audit history and document the incident.

## Data safety
- Requester contact is encrypted and purged 180 days after completion/closure in production.
- Rate-limit identifiers are pseudonymized and removed after 48 hours.
- v1 accepts no private evidence attachments.
- Workers Logs use sampled, sanitized application output.
