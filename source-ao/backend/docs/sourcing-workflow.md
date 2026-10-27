# SOURCE AO sourcing workflow

## Scope

This change adds an admin-only processing action for an already registered sourcing request. It is not called by the public RFQ form and it does not deploy or change production.

## Process a request

Send an authenticated request to:

`POST /api/admin/sourcing-requests/{request_id}/process`

Required header:

`Authorization: Bearer <ADMIN_API_TOKEN>`

The action:
1. Moves a request from `received` to `triage` and records the status event.
2. Reads the request's encrypted RFQ details.
3. Uses the server-side Gemini integration to interpret each requested item.
4. Searches existing SOURCE AO supplier and product evidence.
5. Encrypts and stores the result for later retrieval.
6. Moves the request to `sourcing` only after all items were interpreted and searched successfully.

If AI configuration or search fails, the request remains in `triage`, the run is marked failed, and the API returns an error. An admin can retry after fixing the issue.

## Retrieve the latest run

`GET /api/admin/sourcing-requests/{request_id}/workflow`

This endpoint is admin-only and decrypts the most recent result for the authorised operator.

## State and evidence rules

- `received`: request registered.
- `triage`: AI interpretation or processing in progress / awaiting retry.
- `sourcing`: candidate discovery completed; supplier contact and commercial verification are still required.
- `verifying` / `verified`: must only be used after the applicable supplier verification steps and evidence are recorded.
- Quotation, award, purchasing and delivery are not triggered by this processing endpoint.

A candidate supplier is not proof of exact-product availability, stock, price or delivery date. The system must not mark a request `verified` automatically.

## Storage and security

Migration `0020_sourcing_workflow.sql` adds status events and workflow run records. The workflow result is encrypted using `PII_ENCRYPTION_KEY`; only authenticated administrators may process or retrieve it. Never expose the admin token in browser code or the public RFQ form.

Configure `GEMINI_API_KEY` as a Cloudflare Worker secret in an isolated staging environment before testing. Do not set it against the production Worker during staging validation. Confirm staging uses its own D1 database before applying migrations or deploying.

## Acceptance checks

- Unauthenticated process and retrieval requests return 401.
- Missing secure storage returns 503.
- Missing Gemini secret marks the run failed, keeps the request in `triage`, and does not fabricate sourcing results.
- A successful run returns per-item interpretation and SOURCE AO mission results, records the run encrypted, and ends in `sourcing`.
- Re-run the backend tests and staging acceptance suite before deployment.
