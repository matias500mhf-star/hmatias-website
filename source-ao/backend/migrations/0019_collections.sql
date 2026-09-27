PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sourcing_invoices (
  request_id TEXT PRIMARY KEY,
  invoice_ref TEXT NOT NULL,
  invoice_date TEXT NOT NULL,
  due_date TEXT,
  invoice_amount_aoa REAL NOT NULL CHECK(invoice_amount_aoa > 0),
  internal_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(request_id) REFERENCES sourcing_requests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sourcing_payments (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  payment_ref TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer'
    CHECK(payment_method IN ('bank_transfer','cash','pos','other')),
  amount_aoa REAL NOT NULL CHECK(amount_aoa > 0),
  received_at TEXT NOT NULL,
  internal_notes TEXT,
  voided_at TEXT,
  void_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(request_id) REFERENCES sourcing_requests(id) ON DELETE CASCADE,
  UNIQUE(request_id,payment_ref)
);

CREATE INDEX IF NOT EXISTS idx_sourcing_payments_request
  ON sourcing_payments(request_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_sourcing_invoices_due
  ON sourcing_invoices(due_date);
