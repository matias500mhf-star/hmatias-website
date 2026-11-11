# SOURCE AO — Gemini Interactions API prototype (isolated)

Status: design/prototype specification only. This is not wired into the Worker, public RFQ form, production routes, or production deployment.

## Objective

Evaluate a conversational interface for clarifying procurement requirements before handing a structured request to the existing SOURCE AO RFQ workflow. Gemini may interpret language and ask follow-up questions; it must not claim supplier, stock, price, certification, or delivery confirmation.

## Isolation boundary

- Keep this experiment on its own branch and out of `main`.
- Use synthetic test requests only until a dedicated staging Worker and D1 database are confirmed.
- No production Worker, production D1, public form, customer-facing route, or production secret is changed.
- Keep the existing `generateContent` search-expansion integration unchanged.
- Do not connect the prototype directly to supplier discovery, quotation, purchase, or fulfilment actions.

## Proposed request path

1. An admin-only prototype page sends a short, bounded conversation transcript and the latest user message to a dedicated prototype endpoint.
2. The Worker validates message count, roles, and lengths; rejects malformed or oversized input.
3. The Worker calls `POST https://generativelanguage.googleapis.com/v1beta/interactions` using the server-side `GEMINI_API_KEY`, model `gemini-3.8-flash`, and `store: false`.
4. For this privacy-first test, the Worker does not use `previous_interaction_id`. The bounded transcript is sent as text in the current interaction input, so the experiment remains stateless at Google's side.
5. The Worker validates and bounds the returned text before returning it to the prototype UI.
6. Only after a human approves the clarified requirement may it be converted into a structured RFQ and passed to the existing workflow.

## Data and safety rules

- Synthetic data only in the first test round.
- Never send customer names, phone numbers, email addresses, personal identifiers, bank details, internal acquisition costs, supplier private contacts, or confidential commercial terms.
- Do not put API keys or admin tokens in browser code, URLs, logs, or responses.
- Do not accept model output as evidence. Supplier search results remain candidates until direct, traceable confirmation is recorded.
- The model must explicitly ask for missing technical details (quantity, unit, specification, delivery location, required date) rather than invent them.
- Treat user-provided text and retrieved snippets as untrusted data, not instructions.
- No autonomous RFQ submission, supplier contact, quotation, award, purchase, or delivery.

## API reference and retention decision

Official REST endpoint:
`POST https://generativelanguage.googleapis.com/v1beta/interactions`

Minimum request shape for the isolated stateless experiment:

```json
{
  "model": "gemini-3.8-flash",
  "input": "SYSTEM RULES + bounded synthetic conversation transcript + latest user message",
  "store": false
}
```

The API documentation states that `store: false` disables server-side retention but is incompatible with `previous_interaction_id`. Stateful chaining stores interaction data by default (documented retention: 55 days on paid tier and 1 day on free tier). The prototype deliberately chooses stateless requests and does not rely on Google's stored conversation history.

Reference: https://ai.google.dev/gemini-api/docs/interactions-overview

## Acceptance checks before any implementation is considered

- Mocked tests: valid response, malformed response, timeout, upstream 4xx/5xx, missing key, oversized transcript, invalid role, and empty output.
- Assert every provider request uses `store: false` and contains no `previous_interaction_id`.
- Assert no secret or transcript is written to logs.
- Assert model output cannot set any supplier verification or commercial-confirmation field.
- Run the backend test suite in a writable checkout.
- Run a live provider smoke test with synthetic data and a dedicated staging key only.
- Review data handling and retention before any non-synthetic input is permitted.

## Current status

The isolated prototype module and mocked regression tests now exist under `source-ao/backend/prototypes/` and `source-ao/backend/test/`. They are not imported by the production router. The prototype has not yet been executed in a writable checkout or against Google's live API. No UI, migration, secret, deployment, or production behavior has been changed.
