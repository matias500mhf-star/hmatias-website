PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sourcing_requests (
  id TEXT PRIMARY KEY,
  public_ref TEXT NOT NULL UNIQUE,
  access_token_hash TEXT NOT NULL,
  requirement_text TEXT NOT NULL,
  normalized_search TEXT NOT NULL,
  category TEXT,
  specification TEXT,
  quantity REAL,
  unit TEXT,
  location TEXT NOT NULL,
  needed_by TEXT,
  contact_channel TEXT NOT NULL,
  contact_encrypted TEXT NOT NULL,
  contact_hint TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  assigned_to TEXT,
  internal_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sourcing_requests_status
  ON sourcing_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_sourcing_requests_demand
  ON sourcing_requests(normalized_search, created_at);
CREATE INDEX IF NOT EXISTS idx_sourcing_requests_location
  ON sourcing_requests(location, created_at);

ALTER TABLE verification_requests ADD COLUMN sourcing_request_id TEXT;
CREATE INDEX IF NOT EXISTS idx_verification_requests_sourcing
  ON verification_requests(sourcing_request_id, created_at);
