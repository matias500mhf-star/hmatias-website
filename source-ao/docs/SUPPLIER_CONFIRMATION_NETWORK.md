# Source AO — Supplier Confirmation Network

## Objective
Turn a discovered supplier into a commercially usable answer without confusing visibility with availability.

Source AO must answer four separate questions:
1. Does this supplier exist and operate in the relevant category?
2. Does the supplier handle this exact item or service?
3. Is the requested specification available now?
4. Until when is that confirmation still reliable?

## Verification workflow

### 1. Request created
A search or sourcing request produces a structured requirement:
- item/service;
- specification;
- quantity;
- unit;
- location;
- urgency;
- requester reference.

Status: `draft` or `ready_to_contact`.

### 2. Supplier selected
Source AO ranks candidate suppliers using:
- category fit;
- location;
- source quality;
- recency;
- past confirmations;
- specification match.

No availability claim is made at this stage.

### 3. Confirmation request sent
A standard confirmation message is sent by an authorised channel.

Minimum questions:
- Do you currently supply this exact item/specification?
- What quantity is available or service capacity is available?
- What is the price, if quoted?
- What is the location/pick-up or delivery condition?
- How long is this information valid?

Status: `sent`.

### 4. Supplier replies
The response is captured with:
- supplier identity;
- date/time;
- channel;
- exact wording or evidence reference;
- quantity/price/lead time where provided.

Status: `supplier_replied`.

### 5. Human review
A Source AO/HMATIAS operator checks:
- supplier identity;
- specification match;
- contradictory information;
- timestamp;
- evidence completeness.

AI may extract and structure the reply, but cannot approve it.

### 6. Verification state
Only after review may the record become:
- `supplier_confirmed` — supplier confirms it handles the requirement;
- `in_stock_confirmed` — supplier confirms current stock/capacity for the exact requirement;
- `unavailable` — supplier explicitly confirms no current availability.

### 7. Freshness expiry
Confirmed information expires automatically.

Default policy:
- in-stock confirmation: 24 hours;
- supplier confirmation: 72 hours;
- source-checked listing: 7 days;
- high-volatility products may use shorter windows.

Expired records become `needs_reconfirmation` and must not be presented as current availability.

## Public wording rules

Allowed:
- "Supplier confirmed at 14:32 today"
- "Stock confirmed — valid until 18:00"
- "Source checked 2 days ago — availability not confirmed"
- "Needs reconfirmation"

Not allowed:
- "Available" from a website mention only
- "Best price" without comparison evidence
- "Verified supplier" if only discovered by search
- "In stock" without direct supplier confirmation

## Confirmation message template — English

Hello. Source AO by HMATIAS is validating a customer requirement.

Item/service: {{item}}
Specification: {{specification}}
Quantity: {{quantity}} {{unit}}
Delivery/location: {{location}}

Please confirm:
1. whether you currently supply this exact requirement;
2. available quantity/capacity;
3. price and currency, if quoted;
4. lead time or collection location;
5. how long this information remains valid.

Source AO records the confirmation time so customers can distinguish current information from old listings.

## Confirmation message template — Portuguese

Boa tarde. O Source AO by HMATIAS está a validar uma necessidade de um cliente.

Material/serviço: {{item}}
Especificação: {{specification}}
Quantidade: {{quantity}} {{unit}}
Local de entrega/levantamento: {{location}}

Pedimos, por favor, a confirmação de:
1. se fornecem atualmente esta especificação exata;
2. quantidade/capacidade disponível;
3. preço e moeda, caso possam cotar;
4. prazo ou local de levantamento;
5. até quando esta informação se mantém válida.

O Source AO regista a hora da confirmação para distinguir informação atual de anúncios antigos.

## Audit trail
Every commercial confirmation must retain:
- request ID;
- confirmation ID;
- supplier ID;
- evidence reference;
- confirmation channel;
- confirmed time;
- reviewed time;
- reviewer;
- expiry time;
- resulting market observation.

## Privacy and security
- Never expose private supplier notes publicly.
- Store only business contact details required for sourcing.
- Do not publish personal WhatsApp numbers unless they are explicitly business contact channels.
- Evidence files and private conversations must not be committed to public repositories.
- Public UI receives only the minimum verified commercial fields.
