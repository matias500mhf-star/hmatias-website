PRAGMA foreign_keys = ON;

-- Schema only. Commercial partner identities, relationship states and follow-up
-- data are operational records and must be created through the authenticated
-- admin API / private database, never seeded from the public source tree.
CREATE TABLE IF NOT EXISTS commercial_partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'AO',
  partner_type TEXT NOT NULL
    CHECK(partner_type IN ('strategic_partner','supplier','subcontractor','service_provider','technical_partner','commercial_intermediary')),
  relationship_stage TEXT NOT NULL DEFAULT 'introduced'
    CHECK(relationship_stage IN ('introduced','under_review','approved','active','paused','archived')),
  source_channel TEXT NOT NULL DEFAULT 'manual'
    CHECK(source_channel IN ('whatsapp','email','document','manual')),
  locality TEXT,
  website TEXT,
  capabilities_json TEXT NOT NULL DEFAULT '[]',
  sectors_json TEXT NOT NULL DEFAULT '[]',
  source_note TEXT,
  last_interaction_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commercial_partners_stage
  ON commercial_partners(relationship_stage,partner_type,name);

CREATE INDEX IF NOT EXISTS idx_commercial_partners_country
  ON commercial_partners(country_code,relationship_stage);
