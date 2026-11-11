-- HMATIAS: visitor receipt queue, separate from internal lead-alert delivery.
-- Existing records are skipped so historical enquiries are not emailed retroactively.
-- SQLite/D1 does not permit CURRENT_TIMESTAMP as an ALTER TABLE column default.
ALTER TABLE website_leads ADD COLUMN receipt_state TEXT NOT NULL DEFAULT 'skipped'
  CHECK(receipt_state IN ('pending','accepted','skipped'));
ALTER TABLE website_leads ADD COLUMN receipt_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE website_leads ADD COLUMN next_receipt_attempt TEXT NOT NULL DEFAULT '';
ALTER TABLE website_leads ADD COLUMN receipt_accepted_at TEXT;
UPDATE website_leads SET next_receipt_attempt=CURRENT_TIMESTAMP WHERE next_receipt_attempt='';
CREATE INDEX IF NOT EXISTS idx_website_leads_receipts
  ON website_leads(receipt_state,next_receipt_attempt,created_at);
