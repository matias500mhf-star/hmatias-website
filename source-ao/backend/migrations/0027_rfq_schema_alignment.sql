PRAGMA foreign_keys = ON;

ALTER TABLE sourcing_requests
  ADD COLUMN rfq_details_encrypted TEXT;

ALTER TABLE sourcing_requests
  ADD COLUMN submission_key_hash TEXT;

ALTER TABLE sourcing_requests
  ADD COLUMN rfq_payload_hash TEXT;

ALTER TABLE sourcing_requests
  ADD COLUMN contact_purged_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sourcing_requests_submission_key
  ON sourcing_requests(submission_key_hash);

CREATE INDEX IF NOT EXISTS idx_sourcing_requests_payload_hash
  ON sourcing_requests(rfq_payload_hash);

CREATE INDEX IF NOT EXISTS idx_sourcing_requests_contact_purged_at
  ON sourcing_requests(contact_purged_at, updated_at);
