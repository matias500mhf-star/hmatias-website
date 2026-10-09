-- HMATIAS: institutional website leads, separated from Source AO sourcing requests.
-- No plaintext names, emails, phone numbers or descriptions in indexed columns.
CREATE TABLE IF NOT EXISTS website_leads (
  id TEXT PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  submission_hash TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('contact','business','appointment')),
  service TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received','triage','responded','closed')),
  encrypted_payload TEXT NOT NULL,
  alert_state TEXT NOT NULL DEFAULT 'pending' CHECK(alert_state IN ('pending','accepted')),
  alert_attempts INTEGER NOT NULL DEFAULT 0,
  next_alert_attempt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  alert_accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_website_leads_created ON website_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_leads_alert ON website_leads(alert_state,next_alert_attempt,created_at);
