PRAGMA foreign_keys = ON;

ALTER TABLE sourcing_requests ADD COLUMN contact_purged_at TEXT;
CREATE INDEX IF NOT EXISTS idx_sourcing_requests_contact_retention
  ON sourcing_requests(status, updated_at, contact_purged_at);
