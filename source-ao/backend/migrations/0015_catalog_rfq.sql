-- Additive: existing sourcing requests and private links remain valid.
ALTER TABLE sourcing_requests ADD COLUMN rfq_details_encrypted TEXT;
ALTER TABLE sourcing_requests ADD COLUMN submission_key_hash TEXT;
ALTER TABLE sourcing_requests ADD COLUMN rfq_payload_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sourcing_rfq_submission
  ON sourcing_requests(submission_key_hash);
