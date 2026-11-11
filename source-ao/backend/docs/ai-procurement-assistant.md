# SOURCE AO AI procurement assistant

## What this change does

Adds a server-side, admin-only endpoint:

`POST /api/admin/ai/procurement-assistant`

The endpoint uses Google Gemini only to interpret a sourcing request, then calls the existing SOURCE AO procurement mission/search logic. Supplier records, stock observations, prices, verification timestamps and RFQ status remain in SOURCE AO's backend and D1 database. The model is explicitly instructed not to make commercial claims.

## Request

```json
{
  "query": "cimento Portland 50 kg",
  "location": "Luanda",
  "quantity": 20,
  "needed_by": "2026-11-05"
}
```

The endpoint requires the existing admin bearer token. Do not call it from public browser code or embed an admin token in the website.

## Required Cloudflare Worker secrets / variables

Set the API key as a Worker secret, never in source code, `wrangler.jsonc`, or frontend JavaScript:

```sh
npx wrangler secret put GEMINI_API_KEY
```

Optional non-secret Worker variable:

- `GEMINI_MODEL` — defaults to `gemini-2.5-flash`.

Do not enable the endpoint in production until the secret is set and the staging acceptance checks pass. The endpoint fails closed with `ai_not_configured` if the secret is absent. Rotate any credential previously pasted into chat or committed to a repository.

## Response and evidence boundary

The response includes the AI interpretation and a procurement mission assembled by the existing backend. A supplier candidate is not proof of exact product availability; stock and price claims must be supported by current, traceable SOURCE AO observations or supplier confirmations.

## Deployment checklist

1. Configure `GEMINI_API_KEY` as a Worker secret in staging.
2. Confirm the chosen Gemini model is enabled for the Google AI Studio key.
3. Test unauthenticated, invalid-input, provider-error, and successful requests.
4. Confirm only admin users can receive private supplier/contact details.
5. Run the complete backend test suite and staging acceptance checks.
6. Deploy only after review and explicit approval.
