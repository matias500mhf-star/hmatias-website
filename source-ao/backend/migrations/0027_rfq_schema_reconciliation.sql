-- Reconcile structured RFQ persistence with src/sourcing.js. contact_purged_at already exists in migration 0004.
-- Additive only: existing sourcing requests and private tracking links remain valid.
PRAGMA foreign_keys = ON;

ALTER TABLE sourcing_requests ADD COLUMN rfq_details_encrypted TEXT;
ALTER TABLE sourcing_requests ADD COLUMN submission_key_hash TEXT;
ALTER TABLE sourcing_requests ADD COLUMN rfq_payload_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sourcing_rfq_submission
  ON sourcing_requests(submission_key_hash);

CREATE INDEX IF NOT EXISTS idx_sourcing_rfq_payload_hash
  ON sourcing_requests(rfq_payload_hash);
