PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS private_sourcing_suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'AO' CHECK(country_code IN ('AO','NA','ZA')),
  market_channel TEXT NOT NULL DEFAULT 'formal'
    CHECK(market_channel IN ('formal','informal','regional')),
  supplier_role TEXT NOT NULL DEFAULT 'supplier'
    CHECK(supplier_role IN ('manufacturer','distributor','representative','supplier','trader','market_vendor','technical_supplier')),
  location TEXT,
  website TEXT,
  capabilities_json TEXT NOT NULL DEFAULT '[]',
  brands_json TEXT NOT NULL DEFAULT '[]',
  quality_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK(quality_status IN ('unverified','source_checked','documented','sample_verified','approved')),
  quality_evidence_json TEXT NOT NULL DEFAULT '[]',
  availability_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK(availability_status IN ('unknown','on_request','confirmed','unavailable')),
  private_contact_encrypted TEXT,
  contact_hint TEXT,
  internal_notes TEXT,
  confidentiality TEXT NOT NULL DEFAULT 'private'
    CHECK(confidentiality='private'),
  last_verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_private_sourcing_suppliers_market
  ON private_sourcing_suppliers(country_code,market_channel,quality_status);

CREATE INDEX IF NOT EXISTS idx_private_sourcing_suppliers_quality
  ON private_sourcing_suppliers(quality_status,availability_status,updated_at);
