PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT,
  location TEXT NOT NULL,
  website TEXT,
  public_status TEXT NOT NULL DEFAULT 'source_checked',
  last_verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  specification TEXT,
  unit TEXT,
  aliases_json TEXT NOT NULL DEFAULT '[]',
  search_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  service_category TEXT NOT NULL,
  specialties_json TEXT NOT NULL DEFAULT '[]',
  location TEXT NOT NULL,
  website TEXT,
  verification_status TEXT NOT NULL DEFAULT 'source_checked',
  last_verified_at TEXT NOT NULL,
  search_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS verification_requests (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL,
  item_id TEXT,
  requirement_text TEXT NOT NULL,
  specification TEXT,
  quantity REAL,
  unit TEXT,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  requested_at TEXT,
  expires_at TEXT,
  supplier_response_json TEXT,
  responded_at TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  verification_request_id TEXT,
  observed_at TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  source_type TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  quantity_reported REAL,
  price_reported REAL,
  currency TEXT,
  location TEXT,
  evidence_reference TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (verification_request_id) REFERENCES verification_requests(id)
);

CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  sector TEXT,
  location TEXT NOT NULL,
  issuer TEXT NOT NULL,
  reference TEXT,
  published_at TEXT,
  deadline TEXT NOT NULL,
  status TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_checked_at TEXT NOT NULL,
  scope_summary TEXT,
  source_fit TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_search_text ON items(search_text);
CREATE INDEX IF NOT EXISTS idx_services_search_text ON service_providers(search_text);
CREATE INDEX IF NOT EXISTS idx_observations_item ON observations(item_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_observations_supplier ON observations(supplier_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(status, deadline);
