-- Private Cloudflare D1 schema; never deploy this data in GitHub Pages.
CREATE TABLE IF NOT EXISTS leads (
  reference TEXT PRIMARY KEY,
  nonce TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('contact','business','appointment')),
  full_name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT NOT NULL,
  service TEXT NOT NULL,
  location TEXT,
  details TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  crm_status TEXT NOT NULL DEFAULT 'pending',
  alert_status TEXT NOT NULL DEFAULT 'pending',
  receipt_status TEXT NOT NULL DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at);
CREATE INDEX IF NOT EXISTS leads_crm_status_idx ON leads(crm_status);
CREATE TABLE IF NOT EXISTS hourly_rate (
  rate_key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
