PRAGMA foreign_keys = ON;

-- Public partner applications are isolated from the approved commercial partner network.
-- Contact and registration details are encrypted; public submission never creates an
-- approved/active partner automatically.
CREATE TABLE IF NOT EXISTS partner_applications (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'AO',
  locality TEXT NOT NULL,
  website TEXT,
  partner_type TEXT NOT NULL
    CHECK(partner_type IN ('supplier','subcontractor','service_provider','technical_partner','strategic_partner')),
  capabilities_json TEXT NOT NULL DEFAULT '[]',
  sectors_json TEXT NOT NULL DEFAULT '[]',
  private_profile_ciphertext TEXT NOT NULL,
  contact_hint TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK(status IN ('pending_review','under_review','accepted','rejected')),
  commercial_partner_id TEXT,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  reviewed_by TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(commercial_partner_id) REFERENCES commercial_partners(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_partner_applications_queue
  ON partner_applications(status,submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_applications_dedupe
  ON partner_applications(dedupe_key,status);
