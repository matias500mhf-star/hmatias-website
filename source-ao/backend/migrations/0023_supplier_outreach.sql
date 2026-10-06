PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sourcing_supplier_outreach (
  request_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'shortlisted'
    CHECK(status IN ('shortlisted','contacted','awaiting_response','needs_clarification','out_of_scope','quote_received','declined','no_response')),
  channel TEXT
    CHECK(channel IS NULL OR channel IN ('email','whatsapp','phone','web','other')),
  contact_reference TEXT,
  contacted_at TEXT,
  responded_at TEXT,
  next_follow_up_at TEXT,
  supplier_quote_ref TEXT,
  response_summary TEXT,
  internal_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(request_id,supplier_id),
  FOREIGN KEY(request_id) REFERENCES sourcing_requests(id) ON DELETE CASCADE,
  FOREIGN KEY(supplier_id) REFERENCES private_sourcing_suppliers(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_sourcing_supplier_outreach_queue
  ON sourcing_supplier_outreach(status,next_follow_up_at,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_sourcing_supplier_outreach_supplier
  ON sourcing_supplier_outreach(supplier_id,updated_at DESC);
