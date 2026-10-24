-- Additive structured RFQ fields. This migration is the canonical source for these columns.
PRAGMA foreign_keys = ON;

ALTER TABLE sourcing_requests ADD COLUMN rfq_details_encrypted TEXT;
ALTER TABLE sourcing_requests ADD COLUMN submission_key_hash TEXT;
ALTER TABLE sourcing_requests ADD COLUMN rfq_payload_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sourcing_rfq_submission
  ON sourcing_requests(submission_key_hash);
